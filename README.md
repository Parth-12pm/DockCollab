## Running with Docker

You can run this project in a containerized environment using Docker and Docker Compose. This setup uses Node.js version **22.14.0** and pnpm version **10.4.1** as specified in the Dockerfile.

### Build and Start the App

First, ensure you have Docker and Docker Compose installed. Then, from the project root, run:

```bash
docker compose up --build
```

This will build the Docker image and start the Next.js app in a container.

- The app will be available at [http://localhost:3000](http://localhost:3000).
- The container exposes port **3000**.

### Configuration Notes

- No environment variables are required by default, but you can add a `.env` file and uncomment the `env_file` line in `docker-compose.yaml` if needed for your setup.
- The Docker Compose service is named `typescript-app` and uses the Dockerfile at `./docker/next-env.DockerFile`.
- The app runs as a non-root user for improved security.

### Project-specific Docker Details

- **Node.js version:** 22.14.0
- **pnpm version:** 10.4.1
- **Exposed port:** 3000
- **Service name:** typescript-app

For any custom configuration, update the `docker-compose.yaml` or Dockerfile as needed for your environment.
