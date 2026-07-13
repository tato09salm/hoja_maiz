# Script para ejecutar la app usando el entorno virtual
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPython = Join-Path $scriptDir "venv\Scripts\python.exe"
$venvStreamlit = Join-Path $scriptDir "venv\Scripts\streamlit.exe"

# Primero, instalar Streamlit si no existe
if (-not (Test-Path $venvStreamlit)) {
    Write-Host "Instalando Streamlit en el entorno virtual..."
    & $venvPython -m pip install streamlit tensorflow==2.15.1
}

# Ejecutar la app
Write-Host "Iniciando la aplicación..."
& $venvPython -m streamlit run app.py
