# Simple HTTP Server for MediCare App
# This script starts a local web server so voice recognition works

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MediCare Assistant - Local Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
}

if ($pythonCmd) {
    Write-Host "Starting server with Python..." -ForegroundColor Green
    Write-Host ""
    Write-Host "Server running at: http://localhost:8000" -ForegroundColor Yellow
    Write-Host "Open this URL in Chrome browser:" -ForegroundColor Yellow
    Write-Host "  http://localhost:8000/mobile-app.html" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
    Write-Host ""
    
    # Start Python HTTP server
    & $pythonCmd -m http.server 8000
    
} else {
    Write-Host "Python not found. Installing alternative server..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check if Node.js is installed
    if (Get-Command node -ErrorAction SilentlyContinue) {
        Write-Host "Using Node.js http-server..." -ForegroundColor Green
        
        # Install http-server if not present
        $httpServerExists = node -e "try { require.resolve('http-server'); console.log('yes'); } catch(e) { console.log('no'); }"
        if ($httpServerExists -eq "no") {
            Write-Host "Installing http-server..." -ForegroundColor Yellow
            npm install -g http-server
        }
        
        Write-Host ""
        Write-Host "Server running at: http://localhost:8000" -ForegroundColor Yellow
        Write-Host "Open this URL in Chrome browser:" -ForegroundColor Yellow
        Write-Host "  http://localhost:8000/mobile-app.html" -ForegroundColor Green
        Write-Host ""
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
        Write-Host ""
        
        npx http-server -p 8000
        
    } else {
        Write-Host "ERROR: Neither Python nor Node.js found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please install one of the following:" -ForegroundColor Yellow
        Write-Host "  1. Python: https://www.python.org/downloads/" -ForegroundColor Cyan
        Write-Host "  2. Node.js: https://nodejs.org/en/download/" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "After installation, run this script again." -ForegroundColor Yellow
        Write-Host ""
        pause
    }
}
