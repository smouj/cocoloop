#!/bin/sh
set -eu
cd "$(dirname "$0")"
printf '\nOpen http://127.0.0.1:38475 in your browser.\n\n'
exec python3 server.py
