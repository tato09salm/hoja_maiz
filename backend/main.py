import os
import numpy as np
import json
from datetime import datetime, timedelta
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import bcrypt
from jose import JWTError, jwt
from PIL import Image
import io
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
import base64
from authlib.integrations.starlette_client import OAuth

# Importar nuestros módulos
from database import Base, engine, get_db, User, Analysis
from schemas import (
    UserCreate, UserResponse, UserLogin, UserUpdate,
    Token, TokenData, AnalysisCreate, AnalysisResponse, DashboardStats
)

# Cargar variables de entorno
load_dotenv()

# Inicializar FastAPI
app = FastAPI(title="Detector de Enfermedades de Maíz", version="2.0")

# Configurar CORS para permitir solicitudes desde React/Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar OAuth para Google
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    access_token_url='https://accounts.google.com/o/oauth2/token',
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'openid email profile'},
    jwks_uri='https://www.googleapis.com/oauth2/v3/certs',
)

# Configurar seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "tu_clave_secreta_aqui_cambia_esta_en_produccion")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

# Configurar rutas del modelo
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "Models", "MobileNetV2.h5")

# Nombres de clases del dataset y mapeo a etiquetas amigables
RAW_CLASS_NAMES = [
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy"
]

CLASS_NAMES = [
    "Mancha gris",
    "Roña común",
    "Tizón del norte",
    "Sano"
]

# Mapeo inverso para usar en el sistema experto
CLASS_TO_EXPERT = {
    "Mancha gris": "Mancha gris",
    "Roña común": "Roña común",
    "Tizón del norte": "Tizón del norte",
    "Sano": "Sano"
}

# Sistema experto (mismo que en la app Streamlit)
EXPERT_SYSTEM = {
    "Roña común": {
        "pathogen": "Puccinia sorghi",
        "symptoms": "Pústulas de color marrón-rojizo en ambas caras de las hojas, que coalescen en estadios avanzados.",
        "favorable_conditions": "Temperaturas entre 16-25°C y alta humedad relativa (rocío matutino).",
        "cultural_controls": [
            "Usar variedades resistentes (ej: DK-70-89, P-30F53)",
            "Rotación de cultivos con leguminosas (2-3 años)",
            "Eliminar residuos de cosecha",
            "Evitar siembra tardía"
        ],
        "chemical_controls": [
            "Fungicidas protectantes: Mancozeb (2 kg/ha)",
            "Fungicidas curativos: Triazoles (Tebuconazol 250 EC, 0.5 L/ha)",
            "Aplicar en los primeros síntomas, repetir cada 15 días si las condiciones son favorables"
        ],
        "biological_controls": [
            "Bacillus subtilis (1 kg/ha)",
            "Trichoderma harzianum (2 kg/ha)"
        ],
        "severity_level": "Moderada-Alta"
    },
    "Mancha gris": {
        "pathogen": "Cercospora zeae-maydis",
        "symptoms": "Manchas rectangulares de color gris a marrón, limitadas por las nervaduras de las hojas.",
        "favorable_conditions": "Temperaturas entre 22-30°C y alta humedad (>90%) prolongada.",
        "cultural_controls": [
            "Rotación con cultivos no hospedantes (soja, frijol)",
            "Labranza mínima para enterrar residuos",
            "Manejar la densidad de siembra para mejorar la ventilación",
            "Evitar el exceso de nitrógeno"
        ],
        "chemical_controls": [
            "Fungicidas triazoles: Propiconazol (0.4 L/ha)",
            "Fungicidas estrobilurinas: Azoxistrobina (0.3 L/ha)",
            "Aplicar en floración masculina o 2 semanas después"
        ],
        "biological_controls": [
            "Gliocladium virens",
            "Extractos de neem (2%)"
        ],
        "severity_level": "Moderada"
    },
    "Tizón del norte": {
        "pathogen": "Exserohilum turcicum",
        "symptoms": "Lesiones alargadas (cigar-shaped) de color marrón grisáceo, con bordes definidos.",
        "favorable_conditions": "Temperaturas entre 18-27°C y humedad relativa alta (>90%).",
        "cultural_controls": [
            "Usar variedades resistentes (ej: H-513, H-514)",
            "Rotación de cultivos (3 años fuera de maíz)",
            "Eliminar residuos infectados",
            "Mejorar la ventilación en el cultivo"
        ],
        "chemical_controls": [
            "Fungicidas: Difenoconazol + Azoxistrobina (0.5 L/ha)",
            "Aplicar a los primeros signos de la enfermedad",
            "Repetición cada 10-14 días según sea necesario"
        ],
        "biological_controls": [
            "Pseudomonas fluorescens",
            "Bacillus amyloliquefaciens"
        ],
        "severity_level": "Alta"
    },
    "Sano": {
        "message": "La hoja está saludable. Continúa con tu programa de fertilización y riego habitual, y realiza monitoreos semanales del cultivo."
    }
}

# Cargar modelo al iniciar la app
model = None

@app.on_event("startup")
async def load_model_on_startup():
    global model
    if os.path.exists(MODEL_PATH):
        model = load_model(MODEL_PATH)
        print("Modelo MobileNetV2 cargado exitosamente")
    else:
        raise Exception("Modelo no encontrado")

# Funciones auxiliares de seguridad
def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def get_user(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    if not user.is_active:
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tienes permisos suficientes")
    return current_user

# Rutas raíz
@app.get("/")
async def root():
    return {
        "message": "API de Detección de Enfermedades de Maíz",
        "version": "2.0",
        "docs": "/docs"
    }

# Rutas de autenticación
@app.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    return create_user(db=db, user=user)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/google")
async def google_auth(token: str, db: Session = Depends(get_db)):
    try:
        # Verify Google ID Token
        from google.oauth2 import id_token
        from google.auth.transport import requests
        idinfo = id_token.verify_oauth2_token(
            token, requests.Request(), os.getenv("GOOGLE_CLIENT_ID")
        )
        
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        
        # Check if user exists
        user = get_user(db, email)
        if not user:
            # Create new user if not registered
            user = User(
                name=name,
                email=email,
                hashed_password="",
                is_active=True,
                is_admin=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer", "user": UserResponse.model_validate(user)}
    except HTTPException as he:
        raise he  # Re-raise our custom HTTPException
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Rutas de gestión de usuarios (solo admin)
@app.get("/users", response_model=list[UserResponse])
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    users = db.query(User).all()
    return users

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # No permitir borrarse a sí mismo
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes borrar tu propio usuario")
    
    db.delete(db_user)
    db.commit()
    return {"message": "Usuario eliminado exitosamente"}

# Funciones de validación de imagen
def validate_corn_leaf(image: Image.Image) -> tuple[bool, str]:
    try:
        img_array = np.array(image)
        img_hsv = np.array(image.convert("HSV"))
        
        h = img_hsv[:, :, 0]
        s = img_hsv[:, :, 1]
        v = img_hsv[:, :, 2]
        
        green_mask = ((h >= 25) & (h <= 90) & (s > 30) & (v >= 50) & (v <= 230))
        green_percent = np.sum(green_mask) / (img_hsv.shape[0] * img_hsv.shape[1])
        
        if green_percent < 0.10:
            return False, f"La imagen tiene muy pocos tonos de verde (solo {int(green_percent*100)}%)"
        
        img_gray = np.array(image.convert("L"))
        brightness = np.mean(img_gray)
        
        if brightness < 30:
            return False, "La imagen es demasiado oscura"
        if brightness > 230:
            return False, "La imagen es demasiado clara"
        
        std_dev = np.std(img_array)
        if std_dev < 20:
            return False, "La imagen es demasiado uniforme, probablemente no es una hoja"
        
        return True, "Validación exitosa"
    
    except Exception as e:
        return False, f"Error en validación: {str(e)}"

# Ruta de predicción y guardado de análisis
@app.post("/predict")
async def predict_disease(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        is_valid_corn_leaf, validation_message = validate_corn_leaf(image)
        
        img_resized = image.resize((224, 224))
        img_array = np.array(img_resized)
        img_expanded = np.expand_dims(img_array, axis=0)
        img_preprocessed = preprocess_input(img_expanded)
        
        predictions = model.predict(img_preprocessed, verbose=0)
        pred_class_idx = np.argmax(predictions[0])
        pred_class = CLASS_NAMES[pred_class_idx]
        confidence = float(predictions[0][pred_class_idx])
        
        MIN_CONFIDENCE = 0.50
        
        if confidence < MIN_CONFIDENCE:
            is_valid_corn_leaf = False
            validation_message = f"Confianza demasiado baja ({int(confidence*100)}%). Por favor sube una imagen clara de una hoja de maíz."
        
        recommendations = EXPERT_SYSTEM.get(pred_class, {})
        
        # Convertir imagen a base64 para guardar
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        # Guardar análisis en la base de datos
        db_analysis = Analysis(
            user_id=current_user.id,
            image_data=f"data:image/jpeg;base64,{img_base64}",
            diagnosis_class=pred_class,
            confidence=confidence,
            is_healthy=pred_class == "Sano",
            recommendations=json.dumps(recommendations)
        )
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        
        response = {
            "success": True,
            "is_corn_leaf": is_valid_corn_leaf,
            "validation_message": validation_message,
            "diagnosis": {
                "class": pred_class,
                "confidence": confidence,
                "is_healthy": pred_class == "Sano"
            } if is_valid_corn_leaf else None,
            "recommendations": recommendations if is_valid_corn_leaf else None,
            "class_probabilities": {
                CLASS_NAMES[i]: float(predictions[0][i])
                for i in range(len(CLASS_NAMES))
            } if is_valid_corn_leaf else None,
            "analysis_id": db_analysis.id if is_valid_corn_leaf else None
        }
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Schema for paginated response
from pydantic import BaseModel
from typing import List

class PaginatedResponse(BaseModel):
    items: List[AnalysisResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

# Rutas de historial y dashboard
@app.get("/analyses", response_model=PaginatedResponse)
async def get_user_analyses(
    page: int = 1,
    per_page: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Calculate offset and limit
    offset = (page - 1) * per_page
    
    # Get total count
    total = db.query(Analysis).filter(Analysis.user_id == current_user.id).count()
    
    # Get paginated analyses
    analyses = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).offset(offset).limit(per_page).all()
    
    # Convert to AnalysisResponse
    analysis_responses = [AnalysisResponse.model_validate(a) for a in analyses]
    
    # Calculate total pages
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    
    return PaginatedResponse(
        items=analysis_responses,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@app.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Análisis no encontrado")
    return AnalysisResponse.model_validate(analysis)

@app.get("/analyses/all", response_model=list[AnalysisResponse])
async def get_all_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).all()
    return [AnalysisResponse.model_validate(a) for a in analyses]

@app.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    analyses = db.query(Analysis).filter(Analysis.user_id == current_user.id).all()
    total_analyses = len(analyses)
    healthy_count = sum(1 for a in analyses if a.is_healthy)
    diseased_count = total_analyses - healthy_count
    
    disease_distribution = {}
    for analysis in analyses:
        disease = analysis.diagnosis_class
        disease_distribution[disease] = disease_distribution.get(disease, 0) + 1
    
    recent_analyses = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).limit(10).all()
    recent_analyses_responses = [AnalysisResponse.model_validate(a) for a in recent_analyses]
    
    return DashboardStats(
        total_analyses=total_analyses,
        healthy_count=healthy_count,
        diseased_count=diseased_count,
        recent_analyses=recent_analyses_responses,
        disease_distribution=disease_distribution
    )