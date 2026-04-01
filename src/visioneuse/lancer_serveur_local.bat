@echo off
setlocal
echo ==================================================
echo   Lancement du serveur local - O.S. Blender Course
echo ==================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Python n'est pas installe ou n'est pas dans le PATH.
    echo Veuillez installer Python depuis https://www.python.org/
    pause
    exit /b
)

:: Open the browser in a separate process
echo [+] Ouverture du navigateur vers http://localhost:8000
start "" "http://localhost:8000"

:: Start the server
echo [+] Lancement du serveur sur le port 8000...
echo [!] Gardez cette fenetre ouverte tant que vous travaillez.
echo [!] Appuyez sur Ctrl+C pour arreter le serveur.
echo.

python -m http.server 8000

if %errorlevel% neq 0 (
    echo.
    echo [IMPORTANT] Si le port 8000 est occupe, essayez un autre port.
    pause
)
