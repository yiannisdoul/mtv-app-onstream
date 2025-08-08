from datetime import datetime, timedelta
from typing import Optional
import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from models import User, UserInDB, TokenData
import logging

logger = logging.getLogger(__name__)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback_secret_key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user(db: AsyncIOMotorClient, username: str) -> Optional[UserInDB]:
    """Get user from database."""
    user_doc = await db.onstream.users.find_one({"username": username})
    if user_doc:
        return UserInDB(**user_doc)
    return None

async def authenticate_user(db: AsyncIOMotorClient, username: str, password: str) -> Optional[UserInDB]:
    """Authenticate user credentials."""
    user = await get_user(db, username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorClient = Depends(lambda: None)  # Will be injected
) -> User:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = await get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    
    # Update last login
    await db.onstream.users.update_one(
        {"username": user.username},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    return User(**user.dict())

async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current authenticated admin user."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def create_user(db: AsyncIOMotorClient, user_data: dict) -> UserInDB:
    """Create a new user."""
    # Check if user exists
    existing_user = await db.onstream.users.find_one({
        "$or": [
            {"username": user_data["username"]},
            {"email": user_data["email"]}
        ]
    })
    
    if existing_user:
        if existing_user.get("username") == user_data["username"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Hash password
    hashed_password = get_password_hash(user_data["password"])
    
    # Create user document
    user_doc = {
        "username": user_data["username"],
        "email": user_data["email"],
        "password_hash": hashed_password,
        "is_admin": False,
        "created_at": datetime.utcnow(),
        "last_login": None
    }
    
    # Insert user
    result = await db.onstream.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    return UserInDB(**user_doc)