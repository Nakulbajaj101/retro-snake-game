from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from snake_game.database import init_db
from snake_game.routers import auth, scores, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")
        # We might want to re-raise if strictly required, but logging is key for now
        # raise e
    yield


app = FastAPI(
    title="Retro Snake Game API",
    description="API for the Retro Snake Game",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - allow frontend to call backend directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://snake-frontend-kxlm.onrender.com",
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(scores.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Retro Snake Game API"}
