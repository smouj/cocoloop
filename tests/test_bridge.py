"""Local API integration tests, stdlib-only."""
import json
import http.client
import subprocess
import sys
import threading
import time
import unittest
from pathlib import Path
from urllib import request, error

ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
import server

class BridgeIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.web=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
        cls.port=cls.web.server_port
        cls.base=f'http://127.0.0.1:{cls.port}'
        cls.thread=threading.Thread(target=cls.web.serve_forever,daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.web.shutdown();cls.web.server_close()

    def api(self,path,method='GET',data=None,auth=False,origin=None):
        headers={}
        if auth:headers['Authorization']='Bearer '+server.TOKEN
        if origin:headers['Origin']=origin
        if data is not None:headers['Content-Type']='application/json'
        req=request.Request(self.base+path,method=method,headers=headers,data=json.dumps(data).encode() if data is not None else None)
        try:
            with request.urlopen(req,timeout=4) as response:return response.status,json.load(response)
        except error.HTTPError as e:return e.code,json.load(e)

    def test_01_health_and_security(self):
        code,health=self.api('/api/health');self.assertEqual(code,200);self.assertTrue(health['ok']);self.assertEqual(health['version'],'0.2.0')
        code,_=self.api('/api/state');self.assertEqual(code,401)
        code,_=self.api('/api/commands','POST',{'actions':[{'type':'set_tempo','bpm':120}]});self.assertEqual(code,401)
        code,_=self.api('/api/state','POST',{'project':{}},origin='http://attacker.invalid');self.assertEqual(code,403)

    def test_02_agent_command_end_to_end(self):
        origin=self.base
        project={'schema':'clstudio.project','version':1,'title':'Test','bpm':120,'bars':2,'tracks':[]}
        code,_=self.api('/api/state','POST',{'project':project},origin=origin)
        self.assertEqual(code,200)
        code,state=self.api('/api/state',auth=True)
        self.assertEqual(code,200);self.assertEqual(state['project']['bpm'],120)
        code,bad=self.api('/api/commands','POST',{'actions':[{'type':'run_shell'}]},auth=True)
        self.assertEqual(code,400)
        code,submitted=self.api('/api/commands','POST',{'actions':[{'type':'set_tempo','bpm':150}]},auth=True)
        self.assertEqual(code,202)
        cmdid=submitted['id']
        code,q=self.api('/api/commands?after=0');self.assertEqual(code,200)
        self.assertTrue(any(c['id']==cmdid for c in q['commands']))
        code,ack=self.api(f'/api/commands/{cmdid}/result','POST',{'status':'applied','message':'OK'},origin=origin)
        self.assertEqual(code,200)
        code,status=self.api(f'/api/commands/{cmdid}',auth=True)
        self.assertEqual(code,200);self.assertEqual(status['command']['status'],'applied')

    def test_03_mcp_initialize_and_tools(self):
        proc=subprocess.Popen([sys.executable,str(ROOT/'bridge'/'mcp_server.py')],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        msgs=[{'jsonrpc':'2.0','id':1,'method':'initialize','params':{'protocolVersion':'2025-06-18','capabilities':{},'clientInfo':{'name':'test','version':'1.0'}}},
              {'jsonrpc':'2.0','method':'notifications/initialized','params':{}},
              {'jsonrpc':'2.0','id':2,'method':'tools/list','params':{}}]
        out,err=proc.communicate('\n'.join(json.dumps(msg) for msg in msgs)+'\n',timeout=5)
        replies=[json.loads(x) for x in out.splitlines() if x.strip()]
        self.assertEqual(len(replies),2,err)
        self.assertEqual(replies[0]['result']['serverInfo']['name'],'cocoloop-cl-studio')
        self.assertIn('cl_apply_actions',[t['name'] for t in replies[1]['result']['tools']])

    def test_04_static_security_headers(self):
        req=request.Request(self.base+'/')
        with request.urlopen(req,timeout=4) as response:
            self.assertEqual(response.status,200)
            self.assertIn("default-src 'none'",response.headers.get('Content-Security-Policy',''))
            self.assertIn("frame-ancestors 'none'",response.headers.get('Content-Security-Policy',''))
            self.assertEqual(response.headers.get('X-Frame-Options'),'DENY')
            self.assertEqual(response.headers.get('Referrer-Policy'),'no-referrer')
            self.assertIn('nosniff',response.headers.get('X-Content-Type-Options',''))

    def test_05_directory_listing_disabled(self):
        code,_=self.api('/assets/')
        self.assertEqual(code,404)

    def test_06_host_header_validation(self):
        connection=http.client.HTTPConnection('127.0.0.1',self.port,timeout=4)
        try:
            connection.putrequest('GET','/api/health',skip_host=True)
            connection.putheader('Host','attacker.invalid')
            connection.endheaders()
            self.assertEqual(connection.getresponse().status,403)
        finally:
            connection.close()

if __name__=='__main__':unittest.main()
