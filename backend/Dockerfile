FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Set work directory
WORKDIR /app

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
# We copy only the lock file and pyproject.toml first to cache dependencies
COPY pyproject.toml uv.lock ./

# Install dependencies into the system python or a venv.
# Since we are in a container, we can install into the system, or keep using venv.
# uv recommends using a venv.
RUN uv sync --frozen --no-install-project --no-dev

# Copy the rest of the application
COPY src/ src/

# Install the project itself
RUN uv sync --frozen --no-dev

# Change ownership to non-root user
# Note: We need to chown the .venv directory as well if it's created by root
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Run the application
# We use `uv run` to ensure we use the environment we just set up, 
# or we can add .venv/bin to PATH. Let's start with explicit path or uv run.
# Using .venv/bin/uvicorn is standard if we synced.
ENV PATH="/app/.venv/bin:$PATH"

CMD sh -c "uvicorn snake_game.main:app --host 0.0.0.0 --port ${PORT:-8000}"
