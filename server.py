#!/usr/bin/env python3
"""CL Studio local HTTP server and authenticated agent action queue. Python 3.10+, no dependencies."""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import secrets
import threading
import time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlsplit, parse_qs

BASE = Path(__file__).resolve().parent
APP_DIR = Path(os.environ.get('COCOLOOP_APP_DIR', str(BASE / 'app'))).resolve()
TOKEN_FILE = Path(os.environ.get('COCOLOOP_HOME', str(Path.home() / '.cocoloop'))) / 'agent-token'
TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
if not TOKEN_FILE.exists():
    try:
        fd = os.open(TOKEN_FILE, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w') as f:
            f.write(secrets.token_urlsafe(40))
    except FileExistsError:
        pass
try:
    os.chmod(TOKEN_FILE, 0o600)
except OSError:
    pass
TOKEN = TOKEN_FILE.read_text().strip()
APP_CSP = (
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; media-src 'self' data: blob:; "
    "connect-src 'self' data: blob:; font-src 'self'; object-src 'none'; "
    "base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
)
LOCK = threading.Lock()
CURRENT_STATE = None
LAST_SEEN = 0
COMMANDS: list[dict] = []
SEQUENCE = 0
ALLOWED_ACTIONS = {
    'set_tempo', 'set_title', 'set_bars', 'set_master', 'add_track',
    'delete_track', 'rename_track', 'set_step', 'set_steps', 'add_note',
    'remove_note', 'set_track', 'set_clip', 'clear_track'
}

class Handler(SimpleHTTPRequestHandler):
    server_version = 'CLStudio/0.2'
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)

    def log_message(self, fmt, *args):
        print('[CL Studio]', fmt % args)

    def end_headers(self):
        # Security headers apply to JSON API responses and static files alike.
        # send_header() buffers headers, so an explicitly set value wins.
        buffered = b''.join(getattr(self, '_headers_buffer', []))
        for name, value in (
            ('Content-Security-Policy', APP_CSP),
            ('X-Content-Type-Options', 'nosniff'),
            ('Referrer-Policy', 'no-referrer'),
            ('X-Frame-Options', 'DENY'),
            ('Permissions-Policy', 'camera=(), microphone=(), geolocation=()'),
        ):
            if name.encode() not in buffered:
                self.send_header(name, value)
        super().end_headers()

    def list_directory(self, path):
        # The app never needs directory indexes; do not expose one.
        self.respond({'error': 'No encontrado'}, 404)
        return None

    def respond(self, value, status=200):
        content = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'none'")
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def authorized(self):
        provided = self.headers.get('Authorization', '')
        return secrets.compare_digest(provided, 'Bearer ' + TOKEN)

    def same_origin(self):
        origin = self.headers.get('Origin', '')
        host = self.headers.get('Host', '')
        return self.valid_host() and origin == 'http://' + host

    def read_json(self):
        length = int(self.headers.get('Content-Length', '0'))
        if length < 2 or length > 2_000_000:
            raise ValueError('Tamaño de mensaje inválido (máximo 2 MB)')
        if 'application/json' not in self.headers.get('Content-Type', ''):
            raise ValueError('Se requiere application/json')
        return json.loads(self.rfile.read(length))

    def valid_host(self):
        return self.headers.get('Host', '') in (
            '127.0.0.1:' + str(self.server.server_port),
            'localhost:' + str(self.server.server_port),
        )

    def do_GET(self):
        global CURRENT_STATE, LAST_SEEN
        if not self.valid_host():
            self.respond({'error':'Host inválido'}, 403);return
        uri = urlsplit(self.path)
        if uri.path == '/api/health':
            with LOCK:
                self.respond({'ok': True, 'version': '0.3.0', 'ui_online': time.monotonic() - LAST_SEEN < 8})
            return
        if uri.path == '/api/state':
            if not self.authorized():
                self.respond({'error':'Token necesario'}, 401);return
            with LOCK:
                self.respond({'project':CURRENT_STATE,'ui_online':time.monotonic()-LAST_SEEN<8})
            return
        if uri.path == '/api/commands':
            # Called from the local web UI. Cross-origin pages cannot read responses.
            if self.headers.get('Origin') and not self.same_origin():
                self.respond({'error':'Origen no autorizado'},403);return
            after=int(parse_qs(uri.query).get('after',['0'])[0])
            with LOCK:
                self.respond({'commands':[c for c in COMMANDS if c['id']>after and c['status']=='queued']})
            return
        if uri.path.startswith('/api/commands/'):
            if not self.authorized():
                self.respond({'error':'Token necesario'},401);return
            try: command_id=int(uri.path.split('/')[-1])
            except ValueError: self.respond({'error':'ID inválido'},400);return
            with LOCK:
                command=next((c for c in COMMANDS if c['id']==command_id),None)
                self.respond({'command':command},200 if command else 404)
            return
        if uri.path.startswith('/api/'):
            self.respond({'error':'No encontrado'},404);return
        if uri.path in ('/',''):
            self.path = '/index.html'
        super().do_GET()

    def do_POST(self):
        global CURRENT_STATE, LAST_SEEN, SEQUENCE
        if not self.valid_host():
            self.respond({'error':'Host inválido'},403);return
        uri=urlsplit(self.path)
        if uri.path not in ['/api/state','/api/commands'] and not uri.path.startswith('/api/commands/'):
            self.respond({'error':'No encontrado'},404);return
        is_agent=self.authorized()
        is_ui=self.same_origin()
        if uri.path == '/api/commands':
            if not is_agent:
                self.respond({'error':'Acceso restringido a agentes autorizados'},401);return
        elif not is_ui:
            self.respond({'error':'Origen de interfaz no autorizado'},403);return
        try:
            body=self.read_json()
            if uri.path == '/api/state':
                if not isinstance(body,dict) or not isinstance(body.get('project'),dict):
                    raise ValueError('Estado inválido')
                with LOCK:
                    CURRENT_STATE=body['project'];LAST_SEEN=time.monotonic()
                self.respond({'ok':True});return
            if uri.path == '/api/commands':
                actions=body.get('actions')
                if not isinstance(actions,list) or not 1<=len(actions)<=64:
                    raise ValueError('Se esperan entre 1 y 64 acciones')
                if not all(isinstance(a,dict) and a.get('type') in ALLOWED_ACTIONS for a in actions):
                    raise ValueError('Acción no permitida')
                with LOCK:
                    if time.monotonic()-LAST_SEEN>=8:
                        self.respond({'error':'La interfaz de CL Studio no está abierta'},409);return
                    SEQUENCE+=1
                    item={'id':SEQUENCE,'actions':actions,'status':'queued','created_at':time.time(),'message':None}
                    COMMANDS.append(item)
                    if len(COMMANDS)>250:COMMANDS[:]=COMMANDS[-250:]
                self.respond({'id':SEQUENCE,'status':'queued'},202);return
            if uri.path.endswith('/result'):
                try: command_id=int(uri.path.split('/')[-2])
                except ValueError: raise ValueError('Identificador inválido')
                status=body.get('status')
                if status not in ('applied','rejected'):raise ValueError('Estado inválido')
                with LOCK:
                    c=next((c for c in COMMANDS if c['id']==command_id),None)
                    if c is None: self.respond({'error':'Comando inexistente'},404);return
                    if c['status']=='queued':c['status']=status;c['message']=str(body.get('message',''))[:500]
                self.respond({'ok':True});return
            self.respond({'error':'Ruta inválida'},404)
        except (ValueError, TypeError, json.JSONDecodeError) as e:
            self.respond({'error':str(e)},400)

def main():
    parser=argparse.ArgumentParser(description='CL Studio — estación de audio local')
    parser.add_argument('--port',type=int,default=38475)
    parser.add_argument('--open',action='store_true',help='Abrir automáticamente en el navegador')
    args=parser.parse_args()
    if not 1024<=args.port<=65535:parser.error('Puerto fuera de rango')
    httpd=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    print(f'\n  CL STUDIO 0.3.0  ·  http://127.0.0.1:{args.port}')
    print(f'  Token local: {TOKEN_FILE}  (no compartir)')
    print('  Ctrl+C para cerrar\n')
    if args.open:
        import webbrowser
        threading.Timer(.5, lambda: webbrowser.open(f'http://127.0.0.1:{args.port}')).start()
    try:httpd.serve_forever(poll_interval=.3)
    except KeyboardInterrupt:print('\nCerrando CL Studio')
    finally:httpd.server_close()

if __name__=='__main__':main()
