@echo off
title Luffa Ticket Agent
cd /d "%~dp0"
echo Starting Luffa Ticket Agent...
echo.
start "" http://localhost:3001
start "Luffa Dashboard" cmd /c "cd dashboard && npm run dev"
npm run dev
