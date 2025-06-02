
# docker/fullstack-workspace.Dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    wget \
    vim \
    nano \
    bash \
    openssh-client \
    python3 \
    py3-pip \
    make \
    g++ \
    postgresql-client \
    redis

# Install Node.js tools
RUN npm install -g \
    pnpm@latest \
    nodemon \
    pm2 \
    typescript \
    @types/node \
    tsx

# Create a virtual environment
RUN python3 -m venv /opt/venv

# Activate the virtual environment and install packages
RUN . /opt/venv/bin/activate && \
    pip install --no-cache-dir \
    flask \
    django \
    fastapi \
    uvicorn

# Add venv to PATH
ENV PATH="/opt/venv/bin:$PATH"
WORKDIR /workspace

RUN addgroup -g 1001 workspace && \
    adduser -D -s /bin/bash -u 1001 -G workspace workspace && \
    chown -R workspace:workspace /workspace

USER workspace

# Expose common development ports
EXPOSE 3000 3001 5000 8000 8080

CMD ["tail", "-f", "/dev/null"]