@echo off
color 0B
echo ========================================
echo   MediCare Assistant - Local Server
echo ========================================
echo.
echo Starting server...
echo.
echo Server URL: http://localhost:8000
echo Open in Chrome: http://localhost:8000/mobile-app.html
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd /d "%~dp0"
python -m http.server 8000

pause
