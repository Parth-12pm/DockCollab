// src/backend/server.ts
import express, { Request, Response } from "express";
import cors from "cors";
import { WebSocketManager } from "./websocket-server";
import { DockerManager } from "./docker-manager";

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = Number(process.env.WS_PORT) || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const dockerManager = new DockerManager();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const wsManager = new WebSocketManager(WS_PORT);

// Make wsManager available for potential future use
// You can remove this if you don't plan to use it, or integrate it with your routes
console.log(`WebSocket manager initialized on port ${WS_PORT}`);

// REST API endpoints
app.post("/api/workspace/create", async (req: Request, res: Response) => {
  try {
    const { workspaceId, image, ports, environment } = req.body;

    const containerId = await dockerManager.createWorkspace({
      image: image || "node:18-alpine",
      workspaceId,
      ports: ports || [3000],
      environment: environment || {},
    });

    res.json({
      success: true,
      containerId,
      workspaceId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post(
  "/api/workspace/:workspaceId/file",
  async (req: Request, res: Response) => {
    try {
      const { workspaceId } = req.params;
      const { filePath, content } = req.body;

      await dockerManager.writeFile(workspaceId, filePath, content);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

app.get(
  "/api/workspace/:workspaceId/file",
  async (req: Request, res: Response) => {
    try {
      const { workspaceId } = req.params;
      const filePath = req.query.filePath as string;

      if (!filePath) {
        res.status(400).json({
          success: false,
          error: "Invalid file path",
        });
        return;
      }

      const content = await dockerManager.readFile(workspaceId, filePath);

      res.json({ success: true, content });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

app.delete(
  "/api/workspace/:workspaceId",
  async (req: Request, res: Response) => {
    try {
      const { workspaceId } = req.params;

      await dockerManager.destroyWorkspace(workspaceId);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    websocket: `ws://localhost:${WS_PORT}`,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🔌 WebSocket server running on port ${WS_PORT}`);
});

export default app;
