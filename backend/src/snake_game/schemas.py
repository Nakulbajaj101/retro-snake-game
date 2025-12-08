from pydantic import BaseModel, Field
from datetime import datetime


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    id: str
    username: str
    display_name: str | None = None
    avatar: str | None = None
    theme_preference: str = "neon-green"
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    display_name: str | None = None
    avatar: str | None = None
    theme_preference: str | None = None


class Token(BaseModel):
    token: str
    user: UserResponse


class ScoreCreate(BaseModel):
    score: int = Field(..., ge=0)


class ScoreResponse(BaseModel):
    id: str
    user_id: str
    username: str
    display_name: str | None = None
    avatar: str | None = None
    score: int
    created_at: datetime

    class Config:
        from_attributes = True
