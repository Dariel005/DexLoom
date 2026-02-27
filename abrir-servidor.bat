@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

if not exist package.json (
  echo [ERROR] No se encontro package.json en esta carpeta.
  echo Abre este .bat desde la carpeta del proyecto.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado o no esta en PATH.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm no esta instalado o no esta en PATH.
  pause
  exit /b 1
)

set "HOST=0.0.0.0"
set "PORT=3000"
set "NEXT_TELEMETRY_DISABLED=1"
set "NODE_OPTIONS=--max-old-space-size=1024"
set "ALWAYS_CLEAN=1"
set "ALWAYS_BUILD=0"

echo.
echo ================= PRECHECK =================
if not exist .env.local (
  if exist .env.example (
    copy /Y .env.example .env.local >nul
    echo [INFO] .env.local creado desde .env.example.
  ) else (
    type nul > .env.local
    echo [INFO] .env.local creado vacio.
  )
)

findstr /R /C:"^NEXTAUTH_SECRET=.*" .env.local >nul
if errorlevel 1 (
  echo [WARN] NEXTAUTH_SECRET no existe. Generando automaticamente...
  set "GEN_SECRET=%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%"
  >> .env.local echo NEXTAUTH_SECRET=!GEN_SECRET!
)

findstr /R /C:"^NEXTAUTH_URL=.*" .env.local >nul
if errorlevel 1 (
  >> .env.local echo NEXTAUTH_URL=http://localhost:%PORT%
)

findstr /R /C:"^POKEMON_TCG_API_KEY=.*" .env.local >nul
if errorlevel 1 (
  echo [WARN] POKEMON_TCG_API_KEY no esta configurada. Cartas pueden salir sin precio.
)

echo.
echo ============== CLEAN PORT/BUILD =============
call :kill_port
if errorlevel 1 (
  echo Cierra ese proceso manualmente y vuelve a ejecutar este .bat.
  pause
  exit /b 1
)

if "%ALWAYS_CLEAN%"=="1" (
  if exist .next (
    echo [INFO] Limpiando cache/build de Next en carpeta .next ...
    rmdir /S /Q .next >nul 2>nul
  )
)

if not exist node_modules\ (
  echo [INFO] Dependencias no detectadas. Instalando...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Fallo npm install.
    pause
    exit /b 1
  )
)

if not exist node_modules\next\dist\bin\next (
  echo [ERROR] No se encontro Next.js en node_modules.
  echo Ejecuta npm install y vuelve a intentar.
  pause
  exit /b 1
)

set "NEED_BUILD=0"
if not exist .next\BUILD_ID set "NEED_BUILD=1"
if not exist .next\prerender-manifest.json set "NEED_BUILD=1"
if not exist .next\routes-manifest.json set "NEED_BUILD=1"
if "%ALWAYS_BUILD%"=="1" set "NEED_BUILD=1"

if "%NEED_BUILD%"=="1" (
  echo [INFO] Generando build de produccion limpio...
  call npm run build
  if errorlevel 1 (
    echo [ERROR] Fallo npm run build.
    pause
    exit /b 1
  )
)

call :kill_port
if errorlevel 1 (
  echo [ERROR] El puerto %PORT% esta ocupado y no se puede iniciar Next.
  pause
  exit /b 1
)

echo.
echo ================ START SERVER ================
echo [INFO] Local: http://localhost:%PORT%
echo [INFO] Red local: http://TU-IP-LOCAL:%PORT%
echo [INFO] Para ver tu IP local ejecuta: ipconfig
echo [INFO] Si entra desde otra PC, permite Node.js en el Firewall de Windows.
call npm run start -- -H %HOST% -p %PORT%
if errorlevel 1 (
  echo.
  echo [ERROR] El servidor se cerro por un fallo durante el inicio.
  echo Revisa el error de arriba y vuelve a intentar.
  pause
  exit /b 1
)

endlocal
exit /b 0

:kill_port
set "FOUND_PORT_PID=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING" /C:":%PORT% .*ESCUCHANDO"') do (
  set "FOUND_PORT_PID=1"
  set "PROC_NAME="
  for /f "tokens=1 delims=," %%N in ('tasklist /FI "PID eq %%P" /FO CSV /NH') do set "PROC_NAME=%%~N"
  if /I "!PROC_NAME!"=="node.exe" (
    echo [INFO] Cerrando proceso Node en puerto %PORT% - PID %%P ...
    taskkill /F /PID %%P >nul 2>nul
  ) else (
    echo [WARN] Puerto %PORT% ocupado por !PROC_NAME! - PID %%P.
  )
)
if "!FOUND_PORT_PID!"=="1" (
  timeout /t 1 >nul
)

set "PORT_PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING" /C:":%PORT% .*ESCUCHANDO"') do set "PORT_PID=%%P"
if defined PORT_PID (
  echo [ERROR] El puerto %PORT% sigue ocupado por PID %PORT_PID%.
  exit /b 1
)
exit /b 0
