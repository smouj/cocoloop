# CocoLoop (CL Studio) — Guía rápida

## Requisitos

- Windows 10/11, Linux o macOS.
- Python 3.10 o superior, gratuito.
- Navegador moderno (Edge, Chrome o Firefox).

No necesitas instalar paquetes de Python, pagar suscripciones ni crear una cuenta para la aplicación.

## Abrir CocoLoop en Windows

1. Extrae este ZIP.
2. Entra en la carpeta `cocoloop-cl-studio`.
3. Haz doble clic en `start-windows.bat`.
4. La aplicación debería abrirse en `http://127.0.0.1:38475`.

Si Python no se detecta, instálalo desde https://www.python.org/ y repite el paso 3.

## Empezar a producir

En la vista principal puedes modificar patrones de batería, colocar notas en el Piano Roll, cambiar el tempo, ajustar el mezclador y exportar WAV o MIDI. Los proyectos se guardan como `*.clstudio.json`.

## Novedades de la versión 0.2

- Fader **MASTER** en el mezclador.
- Metrónomo con acento de compás (botón **CLICK** o tecla **M**).
- Selector de **velocidad** para las notas nuevas del Piano Roll.
- Botón **DUPLICATE** para copiar una pista completa.
- Atajos **1–4** para cambiar entre Studio, Piano Roll, Mixer y AI Agents.

## Conectar agentes

**Codex:** abre una terminal y registra el MCP con la ruta real donde extrajiste el proyecto:

```powershell
codex mcp add cocoloop-cl-studio -- py C:\CocoLoop-CL-Studio\bridge\mcp_server.py
```

**OpenClaw:** consulta `docs/openclaw-skill/SKILL.md` o el archivo `docs/AGENTS.md`. Requiere que el agente pueda invocar comandos autorizados en la máquina local.

En ambos casos, activa manualmente **Allow agent editing** en el Inspector. Inicialmente está desactivado, y volverá a desactivarse al reiniciar la interfaz.

**Estado:** versión alfa 0.2.0 de navegador con puente local. No es todavía un ejecutable nativo de Windows ni incluye un chat conectado directamente al agente. Los agentes y modelos se instalan/configuran por separado.
