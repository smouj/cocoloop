#!/usr/bin/env python3
"""CL Studio CLI adapter (OpenClaw can execute this tool)."""
import argparse
import json
from pathlib import Path
from client import api, get_project, apply

def main():
    parser=argparse.ArgumentParser(description='Control autorizado de CL Studio')
    sub=parser.add_subparsers(dest='command',required=True)
    sub.add_parser('status');sub.add_parser('project');sub.add_parser('tracks')
    sub.add_parser('ping')
    act=sub.add_parser('action');act.add_argument('json',help='Acción en JSON')
    batch=sub.add_parser('batch');batch.add_argument('json',help='Lista JSON de acciones')
    batchfile=sub.add_parser('batch-file');batchfile.add_argument('path',help='Ruta local a un archivo JSON con un lote de acciones')
    args=parser.parse_args()
    try:
        if args.command in ('status','ping'):result=api('/api/health',auth=False)
        elif args.command=='project':result=get_project()
        elif args.command=='tracks':result=get_project()['tracks']
        elif args.command=='action':result=apply([json.loads(args.json)])
        elif args.command=='batch':result=apply(json.loads(args.json))
        elif args.command=='batch-file':result=apply(json.loads(Path(args.path).read_text(encoding='utf-8')))
        print(json.dumps(result,ensure_ascii=False,indent=2))
        if isinstance(result,dict) and result.get('ok') is False:raise SystemExit(2)
    except (RuntimeError,ValueError,KeyError) as e:
        print(json.dumps({'ok':False,'error':str(e)},ensure_ascii=False));raise SystemExit(1)

if __name__=='__main__':main()
