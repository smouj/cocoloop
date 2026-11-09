<div align="center">

<img src="branding/cocoloop-logo-color.png" alt="CocoLoop" width="150">

# CocoLoop · CL Studio

**Un DAW local-first de código abierto que los agentes pueden editar de verdad.**

[![CI](https://github.com/smouj/cocoloop/actions/workflows/ci.yml/badge.svg)](https://github.com/smouj/cocoloop/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/smouj/cocoloop?include_prereleases&label=release)](https://github.com/smouj/cocoloop/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-c4ee7c.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-3776ab.svg)](https://www.python.org/)

[English](README.md) · [Inicio rápido](#inicio-rápido) · [Agentes](#agentes) · [Arquitectura](docs/ARCHITECTURE.md) · [Roadmap](docs/ROADMAP.md)

</div>

> **Alpha 0.2.0.** Un DAW de navegador funcional con puente local en Python. No es un sustituto completo de FL Studio ni un instalador nativo. Sin cuentas, sin nube, sin telemetría y sin instalar paquetes: todo el audio, los proyectos y las exportaciones se quedan en tu equipo.

![CL Studio](docs/screenshots/studio.png)

## Qué incluye

- Arreglo de 1–32 compases, secuenciador de 16 pasos, Piano Roll con velocidad y longitud de nota, mezclador con fader maestro y inspector.
- Diez instrumentos sintetizados originales (batería, 808, teclas, lead, pad y sampler de audio).
- Reproducción con Web Audio, metrónomo y medidor estéreo.
- Exportación WAV estéreo 16 bits / 44,1 kHz y MIDI estándar; proyectos portables `.clstudio.json`.
- Integración con Codex (MCP stdio) y OpenClaw (CLI) mediante acciones musicales validadas, consentimiento humano y deshacer compartido.
- Historial de undo/redo para cambios humanos y de agentes; los lotes son atómicos.

## Inicio rápido

### Windows

1. Descarga el ZIP desde [Releases](https://github.com/smouj/cocoloop/releases).
2. Extrae, por ejemplo, en `C:\CocoLoop`.
3. Instala [Python 3.10+](https://www.python.org/) si no lo tienes.
4. Abre `start-windows.bat` o ejecuta `py server.py --open`.

### Linux / macOS

```sh
git clone https://github.com/smouj/cocoloop.git
cd cocoloop
python3 server.py --open
```

Abre <http://127.0.0.1:38475>, pulsa **Play** y empieza a editar. No hay que compilar ni instalar dependencias.

## Agentes

El puente solo expone acciones musicales; nunca shell, red ni acceso arbitrario al sistema de archivos.

```powershell
codex mcp add cocoloop-cl-studio -- py C:\CocoLoop\bridge\mcp_server.py
```

```sh
python3 bridge/clctl.py project
python3 bridge/clctl.py action '{"type":"set_tempo","bpm":128}'
```

Activa **Allow agent editing** en el inspector: está desactivado por defecto y se reinicia al recargar. Consulta [docs/AGENT-API.md](docs/AGENT-API.md) y [docs/AGENTS.md](docs/AGENTS.md).

## Seguridad

- El servidor escucha solo en `127.0.0.1` y valida la cabecera `Host`.
- Las escrituras de agentes requieren un token Bearer en `~/.cocoloop/agent-token` y consentimiento en la interfaz.
- Las respuestas incluyen CSP restrictiva, `nosniff`, `DENY` y política sin referrer.
- **No ha sido auditado de forma independiente.** No expongas el puerto a Internet. Lee [SECURITY.md](SECURITY.md).

## Estado

Alpha utilizable para bocetos, experimentos de sonido, demos de agentes y docencia. El [roadmap](docs/ROADMAP.md) describe el camino a v1: variantes de patrón, automatización, autoguardado con muestras en IndexedDB, latencia, escritorio Tauri, instaladores firmados y auditoría de seguridad.

## Licencia y marca

Código y documentación bajo [MIT](LICENSE). **CocoLoop** es el producto y **CL Studio** la aplicación. El emblema ilustrado pertenece al titular del proyecto; el SVG de `branding/` es una reinterpretación vectorial simplificada. FL Studio e Image-Line son marcas de sus respectivos propietarios; este proyecto no está afiliado a ellos ni incluye recursos propietarios.
