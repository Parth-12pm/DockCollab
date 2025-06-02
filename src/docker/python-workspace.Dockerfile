# docker/python-workspace.Dockerfile  
FROM python:3.11-alpine

RUN apk add --no-cache \
    git \
    curl \
    wget \
    vim \
    nano \
    bash \
    openssh-client \
    gcc \
    musl-dev \
    linux-headers

WORKDIR /workspace

RUN addgroup -g 1001 workspace && \
    adduser -D -s /bin/bash -u 1001 -G workspace workspace && \
    chown -R workspace:workspace /workspace

USER workspace

CMD ["tail", "-f", "/dev/null"]
