# Retro Snake Game

A full-stack retro snake game with user authentication, score tracking, and leaderboards.

## Project Structure

```
retro-snake-game/
├── backend/          # FastAPI backend (Python)
├── frontend/         # React frontend (TypeScript)
└── README.md         # This file
```

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies using UV:
```bash
uv sync
```

3. Run the backend server:
```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 3000
```

The API will be available at `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`
- ReDoc: `http://localhost:3000/redoc`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:8080`

## Configuration

### Backend
- Default port: `3000`
- CORS is configured to allow requests from `http://localhost:8080` and `http://localhost:5173`
- Database: SQLite (`snake_game.db`)

### Frontend
- Default port: `8080`
- API endpoint: `http://localhost:3000/api` (configurable via `VITE_API_BASE_URL` environment variable)

## Running Tests

### Backend Tests
```bash
cd backend
uv run pytest
```

All backend tests passed ✅ (13 tests)

### Frontend Unit Tests
```bash
cd frontend
npm test
```

All frontend unit tests passed ✅ (6 tests)

### Frontend E2E Tests
```bash
cd frontend
npm run test:e2e
```

The e2e tests will automatically start both the backend and frontend servers.

**Test Categories:**
- Authentication flows (5 tests)
- Game functionality (4 tests)
- Leaderboard display (4 tests)
- Full user journeys (3 tests)
- **Score submission integration (3 tests)** ✨ NEW
- **Error handling integration (6 tests)** ✨ NEW
- **API contract tests (7 tests)** ✨ NEW

**Total E2E Tests**: 32 tests

See [INTEGRATION_TESTS.md](./INTEGRATION_TESTS.md) for detailed documentation.

**New Integration Tests Added:**
- Score submission integration (3 tests)
- Error handling integration (6 tests)
- API contract tests (7 tests)

**Total E2E Tests**: 32 tests

## Features

- 🐍 Retro Snake Game
- 👤 User Authentication (Register/Login)
- 📊 Score Tracking
- 🏆 Leaderboard
- 💪 Password Strength Indicator
- ⌨️ Keyboard Controls (Arrow Keys or WASD)

## Development

### Backend
- Uses FastAPI with SQLAlchemy ORM
- JWT token-based authentication
- SQLite database for simplicity

### Frontend
- React with TypeScript
- Vite for fast development
- TanStack Query for data fetching
- Playwright for e2e testing

## Environment Variables

### Frontend
Create a `.env` file in the `frontend/` directory:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

If not set, it defaults to `http://localhost:3000/api`.

## Notes

- The backend and frontend run as separate services
- CORS is configured to allow communication between them
- All tests are passing and the integration is working correctly
- The frontend can now use WASD keys in username/password fields without interference from the game controls

