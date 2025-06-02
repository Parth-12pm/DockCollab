// src/backend/websocket-server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { DockerManager } from './docker-manager';

// Define specific data types for different message types
export interface TerminalData {
  action: 'create' | 'input';
  image?: string;
  ports?: number[];
  environment?: Record<string, string>;
  input?: string;
}

export interface CommandData {
  containerId: string;
  command: string;
}

export interface FileWriteData {
  filePath: string;
  content: string;
}

export interface FileReadData {
  filePath: string;
}

export interface TerminalMessage {
  type: 'terminal' | 'command' | 'file-write' | 'file-read';
  workspaceId: string;
  data: TerminalData | CommandData | FileWriteData | FileReadData;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private dockerManager: DockerManager;
  private terminals: Map<string, NodeJS.ReadWriteStream> = new Map();

  constructor(port: number) {
    this.dockerManager = new DockerManager();
    this.wss = new WebSocketServer({ port });
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection');

      ws.on('message', async (data: Buffer) => {
        try {
          const message: TerminalMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: error instanceof Error ? error.message : 'Unknown error' 
          }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: TerminalMessage): Promise<void> {
    const { type, workspaceId, data } = message;

    switch (type) {
      case 'terminal':
        await this.handleTerminalMessage(ws, workspaceId, data as TerminalData);
        break;
      
      case 'command':
        await this.handleCommandMessage(ws, workspaceId, data as CommandData);
        break;
      
      case 'file-write':
        await this.handleFileWrite(ws, workspaceId, data as FileWriteData);
        break;
      
      case 'file-read':
        await this.handleFileRead(ws, workspaceId, data as FileReadData);
        break;
    }
  }

  private async handleTerminalMessage(ws: WebSocket, workspaceId: string, data: TerminalData): Promise<void> {
    const terminalId = `${workspaceId}-terminal`;
    
    if (data.action === 'create') {
      // Create new container and terminal session
      const containerId = await this.dockerManager.createWorkspace({
        image: data.image || 'node:18-alpine',
        workspaceId,
        ports: data.ports || [3000, 8080],
        environment: data.environment || {}
      });
      
      const terminalStream = await this.dockerManager.createTerminalSession(containerId);
      this.terminals.set(terminalId, terminalStream);
      
      // Forward terminal output to WebSocket
      terminalStream.on('data', (chunk) => {
        ws.send(JSON.stringify({
          type: 'terminal-output',
          workspaceId,
          data: chunk.toString()
        }));
      });
      
      terminalStream.on('error', (error) => {
        ws.send(JSON.stringify({
          type: 'terminal-error',
          workspaceId,
          data: error.message
        }));
      });
      
      ws.send(JSON.stringify({
        type: 'terminal-ready',
        workspaceId,
        containerId
      }));
    } else if (data.action === 'input') {
      // Send input to terminal
      const terminal = this.terminals.get(terminalId);
      if (terminal && terminal.writable && data.input) {
        terminal.write(data.input);
      }
    }
  }

  private async handleCommandMessage(ws: WebSocket, workspaceId: string, data: CommandData): Promise<void> {
    const { containerId, command } = data;
    
    await this.dockerManager.executeCommand(
      containerId,
      command,
      (output) => {
        ws.send(JSON.stringify({
          type: 'command-output',
          workspaceId,
          data: output
        }));
      },
      (error) => {
        ws.send(JSON.stringify({
          type: 'command-error',
          workspaceId,
          data: error
        }));
      }
    );
  }

  private async handleFileWrite(ws: WebSocket, workspaceId: string, data: FileWriteData): Promise<void> {
    try {
      const { filePath, content } = data;
      await this.dockerManager.writeFile(workspaceId, filePath, content);
      ws.send(JSON.stringify({
        type: 'file-write-success',
        workspaceId,
        filePath
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'file-write-error',
        workspaceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  private async handleFileRead(ws: WebSocket, workspaceId: string, data: FileReadData): Promise<void> {
    try {
      const { filePath } = data;
      const content = await this.dockerManager.readFile(workspaceId, filePath);
      ws.send(JSON.stringify({
        type: 'file-read-success',
        workspaceId,
        filePath,
        content
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'file-read-error',
        workspaceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }
}
