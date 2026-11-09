@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
  py server.py --open
) else (
  where python >nul 2>nul
  if %errorlevel% equ 0 (
    python server.py --open
  ) else (
    echo Python 3.10+ is required. Install it from https://www.python.org/
    pause
  )
)
endlocal
