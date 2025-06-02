# docker/node-workspace.Dockerfile
FROM node:18-alpine

# Install essential development tools
RUN apk add --no-cache \
    git \
    curl \
    wget \
    vim \
    nano \
    bash \
    openssh-client \
    python3 \
    make \
    g++

# Install pnpm globally
RUN npm install -g pnpm@latest

# Create workspace directory
WORKDIR /workspace

# Set up user permissions
RUN addgroup -g 1001 workspace && \
    adduser -D -s /bin/bash -u 1001 -G workspace workspace && \
    chown -R workspace:workspace /workspace

USER workspace

# Keep container running
CMD ["tail", "-f", "/dev/null"]




