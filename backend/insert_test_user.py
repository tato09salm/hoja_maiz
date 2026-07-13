import os
import sys
import bcrypt
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Base, User, SessionLocal

def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def insert_test_user():
    db = SessionLocal()
    try:
        email = "hibridogan2000xd@gmail.com"
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print("Usuario ya existe!")
            return
        
        test_user = User(
            name="Hibrido Gan",
            email=email,
            hashed_password=get_password_hash("123456"),
            is_active=True,
            is_admin=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"Usuario insertado exitosamente! ID: {test_user.id}")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    insert_test_user()
