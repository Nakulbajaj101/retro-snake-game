# Retro Snake Game Backend

FastAPI backend for the Retro Snake Game.

## Setup

This project uses [UV](https://github.com/astral-sh/uv) as the package manager.

### Install Dependencies

```bash
uv sync
```

### Run the Server

```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 3000
```

The API will be available at `http://localhost:3000`

### Run Tests

```bash
uv run pytest
```

### API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3000/docs`
- ReDoc: `http://localhost:3000/redoc`

## Configuration

The backend expects the frontend to run on `http://localhost:8080` (CORS is configured for this).

To change the backend port or other settings, you can set environment variables or modify `config.py`.

## Development

The test database (`test.db`) is created automatically during tests and cleaned up after each test run.

