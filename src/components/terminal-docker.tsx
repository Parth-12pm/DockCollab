// src/components/terminal-docker.tsx
"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TerminalIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import "xterm/css/xterm.css";

interface DockerTerminalProps {
  workspaceId: string;
  onContainerReady?: (containerId: string) => void;
}

interface WebSocketMessage {
  type: string;
  containerId?: string;
  data?: string;
  error?: string;
}

export function DockerTerminal({
  workspaceId,
  onContainerReady,
}: DockerTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<import("xterm").Terminal | null>(null);
  const fitAddonInstance = useRef<import("xterm-addon-fit").FitAddon | null>(
    null
  );
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [containerId, setContainerId] = useState<string | null>(null);
  const [isCreatingContainer, setIsCreatingContainer] = useState(false);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    const terminal = terminalInstance.current;
    if (!terminal) return;

    console.log("Received WebSocket message:", message);

    switch (message.type) {
      case "terminal-ready":
        terminal.writeln("\r\n✅ Container ready!");
        terminal.writeln("📝 You can now run commands...\r\n");
        if (message.containerId) {
          setContainerId(message.containerId);
          onContainerReady?.(message.containerId);
        }
        setIsCreatingContainer(false);
        break;

      case "container-created":
        terminal.writeln("\r\n🎉 Container created successfully!");
        if (message.containerId) {
          setContainerId(message.containerId);
          onContainerReady?.(message.containerId);
        }
        setIsCreatingContainer(false);
        break;

      case "terminal-output":
        if (message.data) {
          terminal.write(message.data);
        }
        break;

      case "terminal-error":
        terminal.writeln(`\r\n❌ Error: ${message.data || message.error}`);
        setIsCreatingContainer(false);
        break;

      case "command-output":
        if (message.data) {
          terminal.write(message.data);
        }
        break;

      case "command-error":
        terminal.writeln(`\r\n❌ Command Error: ${message.data || message.error}`);
        break;

      case "error":
        terminal.writeln(`\r\n❌ Server Error: ${message.data || message.error}`);
        setIsCreatingContainer(false);
        break;

      default:
        console.log("Unknown message type:", message.type);
        break;
    }
  }, [onContainerReady]);

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      terminalInstance.current?.writeln("🔗 WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        handleWebSocketMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
        terminalInstance.current?.writeln(`\r\n❌ Failed to parse message: ${event.data}`);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setIsCreatingContainer(false);
      terminalInstance.current?.writeln("\r\n🔌 WebSocket disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsCreatingContainer(false);
      terminalInstance.current?.writeln("\r\n❌ Connection error occurred");
    };
  }, [handleWebSocketMessage]);

  const loadTerminal = useCallback(async () => {
    const xtermMod = await import("xterm");
    const fitMod = await import("xterm-addon-fit");
    const { Terminal } = xtermMod;
    const { FitAddon } = fitMod;

    const terminal = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#000000",
        foreground: "#22c55e",
        cursor: "#22c55e",
      },
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    if (terminalRef.current) {
      terminal.open(terminalRef.current);
      fitAddon.fit();

      terminal.writeln("🐳 Initializing Docker terminal...");
      terminal.writeln(`📋 Workspace ID: ${workspaceId}`);

      terminal.onData((data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "terminal-input",
              workspaceId,
              data: { input: data },
            })
          );
        }
      });

      window.addEventListener("resize", () => fitAddon.fit());
    }

    terminalInstance.current = terminal;
    fitAddonInstance.current = fitAddon;
  }, [workspaceId]);

  useEffect(() => {
    loadTerminal();
    connectWebSocket();

    return () => {
      terminalInstance.current?.dispose();
      wsRef.current?.close();
    };
  }, [workspaceId, loadTerminal, connectWebSocket]);

  const startContainer = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      terminalInstance.current?.writeln("\r\n❌ WebSocket not connected");
      return;
    }

    if (isCreatingContainer) {
      terminalInstance.current?.writeln("\r\n⏳ Container creation already in progress...");
      return;
    }

    setIsCreatingContainer(true);
    
    const message = {
      type: "create-container",
      workspaceId,
      data: {
        image: "node:18-alpine",
        ports: [3000, 8080],
        environment: {
          NODE_ENV: "development",
        },
      },
    };

    console.log("Sending container creation message:", message);
    
    wsRef.current.send(JSON.stringify(message));
    terminalInstance.current?.writeln("🚀 Starting container...");
    terminalInstance.current?.writeln("⏳ Please wait while the container is being created...");
  };

  const runCommand = (command: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      terminalInstance.current?.writeln("\r\n❌ WebSocket not connected");
      return;
    }

    if (!containerId) {
      terminalInstance.current?.writeln("\r\n❌ No container available. Please start a container first.");
      return;
    }

    const message = {
      type: "execute-command",
      workspaceId,
      data: {
        containerId,
        command,
      },
    };

    console.log("Sending command:", message);
    wsRef.current.send(JSON.stringify(message));
  };

  return (
    <div className="h-full bg-black text-green-400 font-mono">
      <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3">
        <div className="flex items-center">
          <TerminalIcon className="w-4 h-4 mr-2" />
          <span className="text-sm text-gray-300">Docker Terminal</span>
          <div
            className={`ml-2 w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {containerId && (
            <span className="ml-2 text-xs text-blue-400">
              Container: {containerId.substring(0, 8)}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={startContainer}
            disabled={!!containerId || isCreatingContainer || !isConnected}
            className="h-6 px-2 text-xs"
          >
            <Play className="w-3 h-3 mr-1" />
            {isCreatingContainer ? "Creating..." : "Start"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => runCommand("npm init -y")}
            disabled={!containerId}
            className="h-6 px-2 text-xs"
          >
            npm init
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => runCommand("npm install")}
            disabled={!containerId}
            className="h-6 px-2 text-xs"
          >
            npm install
          </Button>
        </div>
      </div>

      <ScrollArea className="h-full p-3">
        <div ref={terminalRef} className="h-[400px] w-full" />
      </ScrollArea>
    </div>
  );
}
