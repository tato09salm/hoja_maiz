import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Base

load_dotenv()

# Database connection
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print("=" * 50)
print("Inicializando Base de Datos")
print("=" * 50)
print(f"Conectando a: {DB_HOST}:{DB_PORT}/{DB_NAME}")

try:
    engine = create_engine(DATABASE_URL)
    
    # Create all tables
    print("\nCreando tablas...")
    Base.metadata.create_all(bind=engine)
    
    print("✅ Tablas creadas exitosamente!")
    print("\nTablas disponibles:")
    for table in Base.metadata.sorted_tables:
        print(f"  - {table.name}")
        
except Exception as e:
    print(f"\n❌ Error al inicializar la base de datos: {e}")
