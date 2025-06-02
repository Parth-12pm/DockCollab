// src/backend/docker-manager.ts
import Docker from "dockerode";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";
import * as path from "path";

export interface ContainerConfig {
  image: string;
  workspaceId: string;
  ports?: number[];
  environment?: Record<string, string>;
}

export class DockerManager {
  private docker: Docker;
  private containers: Map<string, Docker.Container> = new Map();
  private workspaces: Map<string, string> = new Map(); // workspaceId -> containerPath

  constructor() {
    this.docker = new Docker();
  }

  async createWorkspace(config: ContainerConfig): Promise<string> {
    const containerId = uuidv4();
    const workspacePath = path.join("/tmp/workspaces", config.workspaceId);

    // Create workspace directory
    await fs.mkdir(workspacePath, { recursive: true });

    // Create container
    const container = await this.docker.createContainer({
      Image: config.image,
      name: `workspace-${config.workspaceId}`,
      Tty: true,
      OpenStdin: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: "/workspace",
      Env: Object.entries(config.environment || {}).map(
        ([k, v]) => `${k}=${v}`
      ),
      HostConfig: {
        Binds: [`${workspacePath}:/workspace`],
        PortBindings: this.createPortBindings(config.ports || []),
        AutoRemove: false,
      },
    });

    await container.start();

    this.containers.set(containerId, container);
    this.workspaces.set(config.workspaceId, workspacePath);

    return containerId;
  }

  async executeCommand(
    containerId: string,
    command: string,
    onData: (data: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const container = this.containers.get(containerId);
    if (!container) {
      throw new Error("Container not found");
    }

    const exec = await container.exec({
      Cmd: ["sh", "-c", command],
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    });

    const stream = await exec.start({ Tty: true });

    stream.on("data", (chunk) => {
      onData(chunk.toString());
    });

    stream.on("error", (error) => {
      onError(error.message);
    });
  }

  async createTerminalSession(
    containerId: string
  ): Promise<NodeJS.ReadWriteStream> {
    const container = this.containers.get(containerId);
    if (!container) {
      throw new Error("Container not found");
    }

    const exec = await container.exec({
      Cmd: ["sh"],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    });

    return await exec.start({
      hijack: true,
      stdin: true,
      Tty: true,
    });
  }

  async writeFile(
    workspaceId: string,
    filePath: string,
    content: string
  ): Promise<void> {
    const workspacePath = this.workspaces.get(workspaceId);
    if (!workspacePath) {
      throw new Error("Workspace not found");
    }

    const fullPath = path.join(workspacePath, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  async readFile(workspaceId: string, filePath: string): Promise<string> {
    const workspacePath = this.workspaces.get(workspaceId);
    if (!workspacePath) {
      throw new Error("Workspace not found");
    }

    const fullPath = path.join(workspacePath, filePath);
    return await fs.readFile(fullPath, "utf-8");
  }

  async destroyWorkspace(workspaceId: string): Promise<void> {
    const containers = Array.from(this.containers.entries()).filter(
      ([, container]) => container.id.startsWith(workspaceId)
    );

    for (const [containerId, container] of containers) {
      await container.stop();
      await container.remove();
      this.containers.delete(containerId);
    }

    this.workspaces.delete(workspaceId);
  }

  private createPortBindings(ports: number[]): Record<string, Array<{ HostPort: string }>> {
    const bindings: Record<string, Array<{ HostPort: string }>> = {};
    ports.forEach((port) => {
      bindings[`${port}/tcp`] = [{ HostPort: port.toString() }];
    });
    return bindings;
  }
}
