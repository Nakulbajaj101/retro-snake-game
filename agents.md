# Agent Instructions

## Python Backend Development with UV

This project uses **UV** as the Python package manager for the backend. UV is a fast, modern Python package and project manager.

### Creating a New UV Project

When setting up the backend for the first time:

```bash
cd backend
uv init
```

### Installing Dependencies

To sync all dependencies from `pyproject.toml`:

```bash
uv sync
```

### Adding Packages

To add a new package (e.g., FastAPI):

```bash
uv add fastapi
uv add uvicorn[standard]
```

For development dependencies:

```bash
uv add --dev pytest
uv add --dev black
```

### Running Python Files

To run a Python file using UV's managed environment:

```bash
uv run python main.py
```

Or for a FastAPI application:

```bash
uv run uvicorn main:app --reload
```

### Common FastAPI Setup

For this project's backend, the typical setup includes:

```bash
uv add fastapi
uv add uvicorn[standard]
uv add pydantic
uv add sqlalchemy
uv add python-jose[cryptography]
uv add passlib[bcrypt]
uv add python-multipart
```

### Running Tests

```bash
uv run pytest
```

### Notes for AI Agent

- Always use `uv sync` after cloning or when `pyproject.toml` changes
- Use `uv add` instead of `pip install` for adding dependencies
- Use `uv run` prefix for running Python commands to ensure correct environment
- UV automatically manages virtual environments, no need to manually activate
