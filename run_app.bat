@echo off
cd /d "%~dp0"
venv\Scripts\python.exe -m pip install streamlit tensorflow==2.15.1
venv\Scripts\python.exe -m streamlit run app.py
pause
