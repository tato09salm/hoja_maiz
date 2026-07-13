# 🚀 Instrucciones para Ejecutar el Sistema

## Estructura del Proyecto
```
hoja_maiz/
├── app.py                  # App Streamlit original
├── backend/                # Backend FastAPI
│   └── main.py
├── frontend/               # Frontend Next.js
│   ├── package.json
│   ├── next.config.js
│   └── app/
│       ├── layout.jsx
│       └── page.jsx
├── Models/
│   └── MobileNetV2.h5
└── requirements.txt
```

## Paso 1: Instalar dependencias del backend
Primero, activa tu entorno virtual y instala las dependencias:
```bash
# En Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Instalar dependencias:
pip install -r requirements.txt
```

## Paso 2: Ejecutar el backend FastAPI
Abre una terminal, navega a la carpeta del proyecto y ejecuta:
```bash
# Asegúrate de que el entorno virtual esté activado
cd backend
uvicorn main:app --reload
```
El backend estará corriendo en **http://localhost:8000**

- Ver la documentación de la API: **http://localhost:8000/docs** (Swagger UI)

## Paso 3: Ejecutar el frontend Next.js
Abre una **segunda terminal** y sigue estos pasos:
```bash
# Navega a la carpeta frontend
cd frontend

# Instala las dependencias de Node.js
npm install

# Inicia el servidor de desarrollo
npm run dev
```
El frontend estará corriendo en **http://localhost:3000**

## Cómo usar el sistema
1. Abre **http://localhost:3000** en tu navegador
2. Sube una imagen de una hoja de maíz
3. Obtén el diagnóstico y las recomendaciones del sistema experto

## Características
- ✅ Backend FastAPI con endpoint `/predict`
- ✅ Frontend Next.js moderno con Tailwind CSS
- ✅ Sistema experto completo con recomendaciones
- ✅ CORS habilitado para comunicación entre frontend y backend
