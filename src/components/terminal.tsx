"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TerminalIcon } from "lucide-react";
import "xterm/css/xterm.css"; // This must remain static per Next.js rules

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TerminalProps {}

export function Terminal({}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<import("xterm").Terminal | null>(null);
  const fitAddonInstance = useRef<import("xterm-addon-fit").FitAddon | null>(null);
  const inputBuffer = useRef<string>("");

  useEffect(() => {
    let terminal: import("xterm").Terminal;
    let fitAddon: import("xterm-addon-fit").FitAddon;

    const loadTerminal = async () => {
      const xtermMod = await import("xterm");
      const fitMod = await import("xterm-addon-fit");
      const { Terminal } = xtermMod;
      const { FitAddon } = fitMod;

      terminal = new Terminal({
        cursorBlink: true,
        theme: {
          background: "#000000",
          foreground: "#22c55e",
          cursor: "#22c55e",
        },
        fontSize: 14,
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      });

      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      if (terminalRef.current) {
        terminal.open(terminalRef.current);
        fitAddon.fit();

        terminal.writeln("Welcome to the interactive terminal!");
        terminal.write("$ ");

        terminal.onData((data) => {
          const code = data.charCodeAt(0);
          switch (code) {
            case 13: // Enter
              const command = inputBuffer.current.trim();
              inputBuffer.current = "";
              handleCommand(command, terminal);
              break;
            case 127: // Backspace
              if (inputBuffer.current.length > 0) {
                inputBuffer.current = inputBuffer.current.slice(0, -1);
                terminal.write("\b \b");
              }
              break;
            default:
              inputBuffer.current += data;
              terminal.write(data);
          }
        });

        window.addEventListener("resize", () => fitAddon.fit());
      }

      terminalInstance.current = terminal;
      fitAddonInstance.current = fitAddon;
    };

    loadTerminal();

    return () => {
      terminalInstance.current?.dispose();
      window.removeEventListener("resize", () => fitAddonInstance.current?.fit());
    };
  }, []);

  const handleCommand = (cmd: string, terminal: import("xterm").Terminal) => {
    switch (cmd.toLowerCase()) {
      case "help":
        terminal.writeln("\r\nAvailable commands: help, clear, about");
        break;
      case "clear":
        terminal.clear();
        break;
      case "about":
        terminal.writeln("\r\nThis is a demo terminal built with xterm.js and Next.js");
        break;
      case "":
        break;
      default:
        terminal.writeln(`\r\nCommand not found: ${cmd}`);
    }
    terminal.write("\r\n$ ");
  };

  return (
    <div className="h-full bg-black text-green-400 font-mono">
      <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-3">
        <TerminalIcon className="w-4 h-4 mr-2" />
        <span className="text-sm text-gray-300">Terminal</span>
      </div>

      <ScrollArea className="h-full p-3">
        <div ref={terminalRef} className="h-[400px] w-full" />
      </ScrollArea>
    </div>
  );
}
