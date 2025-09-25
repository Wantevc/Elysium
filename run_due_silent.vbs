Set sh = CreateObject("Wscript.Shell")
sh.Run """C:\Windows\System32\curl.exe"" -s -X POST http://localhost:3000/api/cron/run-due", 0, False