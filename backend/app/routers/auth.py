from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, models

router = APIRouter(prefix="/api/auth", tags=["Authentication & RBAC"])

@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate via Username/Password OR 4-digit Cashier PIN code.
    Returns access token and user role profile.
    """
    user = None

    if payload.pin_code:
        user = crud.get_user_by_pin(db=db, pin_code=payload.pin_code)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid PIN code"
            )
    elif payload.username and payload.password:
        user = crud.get_user_by_username(db=db, username=payload.username)
        if not user or user.password_hash != payload.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either pin_code or username/password"
        )

    token = f"mock-jwt-token-{user.id}-{user.role.lower()}"
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": schemas.UserResponse.model_validate(user)
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(user_id: int = 1, db: Session = Depends(get_db)):
    """Fetch current user profile info"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
