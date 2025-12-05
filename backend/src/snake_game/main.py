from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from snake_game.database import init_db
from snake_game.routers import auth, scores, users

app = FastAPI(
    title="Retro Snake Game API",
    description="API for the Retro Snake Game",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(scores.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Retro Snake Game API"}
