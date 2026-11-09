# CocoLoop — Conexión de agentes

## Codex

1. Ejecuta `py server.py --open` desde la carpeta del proyecto (en Linux y macOS `python3 server.py --open`).
2. Mantén la aplicación abierta. Activa **Allow agent editing** en el inspector; se desactiva con cada recarga.
3. En Windows, reemplaza la ruta de ejemplo y ejecuta:

   ```powershell
   codex mcp add cocoloop-cl-studio -- py C:\CocoLoop-CL-Studio\bridge\mcp_server.py
   codex mcp list
   ```

4. El agente puede usar `cl_get_project` para consultar pistas e identificadores, y `cl_apply_actions` para ejecutar un lote musical de forma transaccional.
5. Comprueba el estado `applied` y vuelve a consultar el proyecto.

## OpenClaw

Requiere un agente con acceso autorizado a ejecución local en el mismo equipo. Consulta `docs/openclaw-skill/SKILL.md` y utiliza `bridge/clctl.py`.

En Windows PowerShell, para evitar problemas de comillas JSON, puedes guardar un lote en `actions.json` y usar:

```powershell
py bridge/clctl.py batch-file actions.json
```

En caso de usar URL/puerto alternativo define `COCOLOOP_URL` en el entorno. Si el token no está en la ubicación predeterminada, define `COCOLOOP_TOKEN`. No compartas el token con otras personas.

## Alcance y limitaciones

Los agentes disponen únicamente de acciones musicales estructuradas, no de acceso al sistema de archivos del usuario por la API de CocoLoop. La versión alfa no contiene chat integrado ni orquestador de agentes. Codex y OpenClaw se instalan y configuran aparte.
