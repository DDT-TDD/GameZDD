@echo off
title GameZDD Launcher

:: Try to launch via installed Electron app first (from dist\win-unpacked)
set "UNPACKED=%~dp0dist\win-unpacked\GameZDD V1.1.exe"
if exist "%UNPACKED%" (
    echo Launching GameZDD...
    start "" "%UNPACKED%"
    exit /b 0
)

:: Try npm start (requires Node.js installed)
where node >nul 2>&1
if %ERRORLEVEL%==0 (
    where npm >nul 2>&1
    if %ERRORLEVEL%==0 (
        echo Starting via npm...
        cd /d "%~dp0"
        if not exist node_modules (
            echo Installing dependencies, please wait...
            npm install --silent
        )
        npm start
        exit /b 0
    )
)

:: Fallback: open launcher in default browser
echo Opening in browser (limited functionality - for full experience use the installer)
start "" "%~dp0launcher.html"
exit /b 0
