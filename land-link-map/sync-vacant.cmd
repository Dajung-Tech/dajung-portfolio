@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist ".env.vacant.local" (
  echo .env.vacant.local 파일이 없습니다.
  echo .env.vacant.local.example을 복사한 뒤 배포 주소와 FAMILY_ACCESS_KEY를 입력하세요.
  pause
  exit /b 1
)

node sync-vacant.mjs
if errorlevel 1 (
  echo.
  echo 동기화에 실패했습니다. 위 오류를 확인하세요.
) else (
  echo.
  echo 동기화가 완료되었습니다.
)
pause
