from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from snake_game.database import get_db
from snake_game.models import User
from snake_game.schemas import UserResponse, UserUpdate
from snake_game.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update fields if provided
    if user_update.display_name is not None:
        current_user.display_name = user_update.display_name
    
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar
        
    if user_update.theme_preference is not None:
        current_user.theme_preference = user_update.theme_preference
    
    db.commit()
    db.refresh(current_user)
    return current_user
