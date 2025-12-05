FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set work directory
WORKDIR /app

# Install system dependencies (needed for dependencies like psycopg2 if we build from source, 
# though psycopg2-binary usually works. Good to have curl for healthchecks)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies from pyproject.toml
# We use pip to install directly from the current directory .
COPY pyproject.toml .
# Create a dummy src structure to allow pip install . to work for dependencies
# or we can just install dependencies separately if we parsed toml. 
# Simplest for this structure is to copy source and install.
COPY src/ src/

# Install the package and dependencies
RUN pip install --no-cache-dir .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "snake_game.main:app", "--host", "0.0.0.0", "--port", "8000"]
