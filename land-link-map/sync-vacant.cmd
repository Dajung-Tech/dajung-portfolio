@echo off
cd /d "%~dp0"

if not exist ".env.vacant.local" (
  echo Missing .env.vacant.local.
  echo Copy .env.vacant.local.example and set LANDLINK_URL and FAMILY_ACCESS_KEY.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found in PATH.
  pause
  exit /b 1
)

node --use-system-ca sync-vacant.mjs
if errorlevel 1 goto sync_failed

echo.
echo Vacant-house sync completed.
pause
exit /b 0

:sync_failed
echo.
echo Vacant-house sync failed. Check the error above.
pause
exit /b 1
