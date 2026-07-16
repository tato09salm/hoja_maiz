import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Cargar variables de entorno
load_dotenv()

# Get the directory of this file (backend directory)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Configurar conexión a PostgreSQL o SQLite
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

if DB_HOST:
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(DATABASE_URL)
else:
    DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'maiz_saludable.db')}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Crear sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Modelos de la base de datos
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relación con análisis
    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")


class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_data = Column(Text, nullable=False)  # Base64 o ruta
    diagnosis_class = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    is_healthy = Column(Boolean, default=False)
    recommendations = Column(Text, nullable=True)  # JSON como texto
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relación con usuario
    user = relationship("User", back_populates="analyses")
    
    @property
    def recommendations_dict(self):
        if self.recommendations:
            import json
            try:
                return json.loads(self.recommendations)
            except:
                return None
        return None


# Función para obtener la sesión de la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()