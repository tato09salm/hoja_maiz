import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine

print("=" * 50)
print("Inicializando Base de Datos")
print("=" * 50)
print("Conectando a través de database.py...")

try:
    # Create all tables
    print("\nCreando tablas...")
    Base.metadata.create_all(bind=engine)
    
    print("✅ Tablas creadas exitosamente!")
    print("\nTablas disponibles:")
    for table in Base.metadata.sorted_tables:
        print(f"  - {table.name}")
        
except Exception as e:
    print(f"\n❌ Error al inicializar la base de datos: {e}")
