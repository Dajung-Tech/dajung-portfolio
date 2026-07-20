@echo off
cd /d "%~dp0"
start "" http://localhost:4173
"C:\Program Files\nodejs\node.exe" server.mjs
