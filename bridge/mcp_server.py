#!/usr/bin/env python3
"""CL Studio MCP server using JSON-RPC stdio (no pip dependencies).
Supports initialize, tools/list, tools/call and ping; instructions for Codex config in docs.
"""
import json
import sys
from client import get_project, apply

TOOL_SCHEMAS = [
  {'name':'cl_get_project','description':'Read current CL Studio project including track IDs, tempo, notes, steps, and arrangement. Read before writing.',
   'inputSchema':{'type':'object','properties':{},'additionalProperties':False}},
  {'name':'cl_apply_actions','description':'Apply 1-64 atomic project editing actions in CL Studio. The user must enable agent editing in the app. Supported action types: set_tempo{bpm}, set_title{title}, set_bars{bars}, set_master{volume}, add_track{instrument,name?,id?}, delete_track{track_id}, rename_track{track_id,name}, set_step{track_id,step,enabled}, set_steps{track_id,steps:[0..15]}, add_note{track_id,pitch,start,length?,velocity?}, remove_note{track_id,pitch,start}, set_track{track_id,field:volume|pan|cutoff|delay|mute|solo,value}, set_clip{track_id,bar,enabled}, clear_track{track_id}. Notes use MIDI pitch; start 0-15 within the one-bar track pattern; clips place pattern in song bars. Operations either all apply or all fail.',
   'inputSchema':{'type':'object','properties':{'actions':{'type':'array','minItems':1,'maxItems':64,'items':{'type':'object','properties':{'type':{'type':'string'}},'required':['type']}}},'required':['actions'],'additionalProperties':False}}
]

def call_tool(name,args):
    if name=='cl_get_project':return get_project()
    if name=='cl_apply_actions':return apply(args['actions'])
    raise RuntimeError('Herramienta desconocida')

def reply(id,result=None,error=None):
    payload={'jsonrpc':'2.0','id':id}
    if error is None:payload['result']=result
    else:payload['error']={'code':-32000,'message':str(error)}
    sys.stdout.write(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n');sys.stdout.flush()

def main():
    for line in sys.stdin:
        try:
            msg=json.loads(line);mid=msg.get('id');method=msg.get('method');args=msg.get('params') or {}
            if mid is None:continue
            if method=='initialize':
                reply(mid,{'protocolVersion':args.get('protocolVersion','2025-06-18'),'capabilities':{'tools':{'listChanged':False}},'serverInfo':{'name':'cocoloop-cl-studio','version':'0.2.0'},'instructions':'CL Studio local music editor. Read current project, ask user to enable agent editing, and make atomic changes through cl_apply_actions.'})
            elif method=='ping':reply(mid,{})
            elif method=='tools/list':reply(mid,{'tools':TOOL_SCHEMAS})
            elif method=='tools/call':
                try:
                    value=call_tool(args.get('name'),args.get('arguments') or {})
                    failed=isinstance(value,dict) and value.get('ok') is False
                    reply(mid,{'content':[{'type':'text','text':json.dumps(value,ensure_ascii=False)}],'isError':failed})
                except Exception as e:
                    reply(mid,{'content':[{'type':'text','text':str(e)}],'isError':True})
            else:reply(mid,error='Método MCP no disponible: '+str(method))
        except Exception as e:
            if 'mid' in locals() and mid is not None:reply(mid,error=e)
            else:print('Invalid MCP message: '+str(e),file=sys.stderr)

if __name__=='__main__':main()
