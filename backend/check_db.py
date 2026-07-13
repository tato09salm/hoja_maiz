from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, User, Analysis
import os

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv()

# Configurar conexión a la base de datos
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}" if DB_HOST else "sqlite:///./maiz_saludable.db"
print(f"Conectando a la base de datos: {DATABASE_URL}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Crear tablas (si no existen)
Base.metadata.create_all(bind=engine)
print("Tablas creadas/verificadas!")

# Abrir sesión
db = SessionLocal()

print("\n--- Usuarios en la base de datos ---")
users = db.query(User).all()
for user in users:
    print(f"ID: {user.id}, Nombre: {user.name}, Email: {user.email}")

print("\n--- Análisis en la base de datos ---")
analyses = db.query(Analysis).all()
for analysis in analyses:
    print(f"ID: {analysis.id}, Usuario ID: {analysis.user_id}, Diagnóstico: {analysis.diagnosis_class}, Confianza: {analysis.confidence*100:.1f}%, Fecha: {analysis.created_at}")

db.close()
