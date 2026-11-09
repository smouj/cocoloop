"""Authenticated connection to the local CL Studio action API. No third-party modules."""
from pathlib import Path
from urllib import request, error
import json
import os
import time

BASE=os.environ.get('COCOLOOP_URL','http://127.0.0.1:38475').rstrip('/')
TOKEN_FILE=Path.home()/'.cocoloop'/'agent-token'

def api(path, body=None, auth=True):
    headers={'Accept':'application/json'}
    if auth:
        token=os.environ.get('COCOLOOP_TOKEN')
        if not token:
            try:token=TOKEN_FILE.read_text().strip()
            except FileNotFoundError:raise RuntimeError('Inicia CL Studio primero (python server.py)')
        headers['Authorization']='Bearer '+token
    if body is not None:
        headers['Content-Type']='application/json'
        data=json.dumps(body).encode('utf-8')
    else:data=None
    req=request.Request(BASE+path,data=data,headers=headers,method='POST' if body is not None else 'GET')
    try:
        with request.urlopen(req,timeout=4) as response:return json.load(response)
    except error.HTTPError as e:
        try:msg=json.load(e).get('error',str(e))
        except Exception:msg=str(e)
        raise RuntimeError(f'CL Studio: {msg}')
    except error.URLError as e:raise RuntimeError(f'No se puede conectar con CL Studio ({BASE}): {e.reason}')

def get_project():
    res=api('/api/state')
    if not res.get('ui_online'):
        raise RuntimeError('Abre CL Studio en el navegador para controlar el proyecto')
    return res.get('project')

def apply(actions):
    data=api('/api/commands',{'actions':actions})
    id=data['id'];start=time.monotonic()
    while time.monotonic()-start<10:
        time.sleep(.25)
        status=api('/api/commands/'+str(id)).get('command')
        if status and status['status']!='queued':
            return {'id':id,'status':status['status'],'message':status.get('message'),'ok':status['status']=='applied'}
    return {'id':id,'status':'queued','ok':False,'message':'La aplicación todavía no ha confirmado la acción'}
