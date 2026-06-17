FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port (Render injects $PORT at runtime)
EXPOSE 8000

# Run — hardcode port 8000; Fly.io internal_port matches
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
