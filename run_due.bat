@echo off
"C:\Windows\System32\curl.exe" -s -X POST http://localhost:3000/api/cron/run-due >NUL 2>&1