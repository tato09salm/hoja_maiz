from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any

# Schemas de Usuario
class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


# Schemas de Token
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None


# Schemas de Análisis
class AnalysisBase(BaseModel):
    image_data: str
    diagnosis_class: str
    confidence: float
    is_healthy: bool
    recommendations: Optional[Dict[str, Any]] = None


class AnalysisCreate(AnalysisBase):
    pass


class AnalysisResponse(AnalysisBase):
    id: int
    user_id: int
    created_at: datetime
    
    @classmethod
    def model_validate(cls, obj, **kwargs):
        if hasattr(obj, 'recommendations_dict'):
            obj.recommendations = obj.recommendations_dict
        return super().model_validate(obj, **kwargs)
    
    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_analyses: int
    healthy_count: int
    diseased_count: int
    recent_analyses: List[AnalysisResponse]
    disease_distribution: Dict[str, int]