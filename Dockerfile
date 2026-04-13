# Use an official lightweight Python image.
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and config
COPY src/ ./src/
COPY config.json .
COPY .env.example .

# Command to run the agent
CMD ["python", "-m", "src.main"]
