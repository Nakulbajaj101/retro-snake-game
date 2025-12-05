from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from snake_game.database import get_db
from snake_game.models import User, Score
from snake_game.schemas import ScoreCreate, ScoreResponse
from snake_game.auth import get_current_user

router = APIRouter(prefix="/scores", tags=["Scores"])


@router.get("", response_model=List[ScoreResponse])
def get_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    if limit > 100:
        limit = 100
    
    scores = (
        db.query(Score)
        .join(User)
        .order_by(Score.score.desc())
        .limit(limit)
        .all()
    )
    
    # Add username to each score
    result = []
    for score in scores:
        result.append({
            "id": score.id,
            "user_id": score.user_id,
            "username": score.user.username,
            "avatar": score.user.avatar,
            "score": score.score,
            "created_at": score.created_at
        })
    
    return result


@router.post("", response_model=ScoreResponse, status_code=status.HTTP_201_CREATED)
def submit_score(
    score_data: ScoreCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_score = Score(
        user_id=current_user.id,
        score=score_data.score
    )
    db.add(new_score)
    db.commit()
    db.refresh(new_score)
    
    return {
        "id": new_score.id,
        "user_id": new_score.user_id,
        "username": current_user.username,
        "avatar": current_user.avatar,
        "score": new_score.score,
        "created_at": new_score.created_at
    }
