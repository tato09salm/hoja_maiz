import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Add the parent directory to path to import our models
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Base, User

load_dotenv()

# Database connection
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_admin():
    print("=" * 50)
    print("Crear Usuario Administrador")
    print("=" * 50)
    
    name = input("Nombre completo del administrador: ").strip()
    email = input("Correo electrónico: ").strip()
    password = input("Contraseña: ").strip()
    
    if not all([name, email, password]):
        print("Error: Todos los campos son obligatorios")
        return
    
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"Error: Ya existe un usuario con el correo {email}")
            return
        
        # Create admin user
        admin_user = User(
            name=name,
            email=email,
            hashed_password=get_password_hash(password),
            is_active=True,
            is_admin=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("\n✅ Usuario administrador creado exitosamente!")
        print(f"ID: {admin_user.id}")
        print(f"Nombre: {admin_user.name}")
        print(f"Email: {admin_user.email}")
        print(f"Admin: Sí")
        
    except Exception as e:
        print(f"Error al crear el usuario: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
