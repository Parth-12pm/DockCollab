"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Navbar } from "@/components/navbar";
import { FileManagement, type FileNode } from "@/components/file-management";
import { CodeEditor } from "@/components/code-editor";
import { Preview } from "@/components/preview";
import { DockerTerminal } from "@/components/terminal-docker";

const initialFiles: FileNode[] = [
  {
    name: "src",
    type: "folder",
    isOpen: true,
    children: [
      {
        name: "components",
        type: "folder",
        isOpen: false,
        children: [
          {
            name: "Header.tsx",
            type: "file",
            content:
              "import React from 'react';\n\nexport default function Header() {\n  return (\n    <header className=\"bg-blue-600 text-white p-4\">\n      <h1>My App</h1>\n    </header>\n  );\n}",
          },
          {
            name: "Footer.tsx",
            type: "file",
            content:
              "import React from 'react';\n\nexport default function Footer() {\n  return (\n    <footer className=\"bg-gray-800 text-white p-4 text-center\">\n      <p>&copy; 2024 My App</p>\n    </footer>\n  );\n}",
          },
        ],
      },
      {
        name: "App.tsx",
        type: "file",
        content:
          'import React from \'react\';\nimport Header from \'./components/Header\';\nimport Footer from \'./components/Footer\';\n\nfunction App() {\n  return (\n    <div className="App">\n      <Header />\n      <main className="min-h-screen p-8">\n        <h1 className="text-4xl font-bold text-center">\n          Welcome to My App\n        </h1>\n        <p className="text-center mt-4 text-gray-600">\n          This is a sample React application.\n        </p>\n      </main>\n      <Footer />\n    </div>\n  );\n}\n\nexport default App;',
      },
      {
        name: "index.tsx",
        type: "file",
        content:
          "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nconst root = ReactDOM.createRoot(\n  document.getElementById('root') as HTMLElement\n);\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);",
      },
      {
        name: "index.css",
        type: "file",
        content:
          "body {\n  margin: 0;\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',\n    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',\n    sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\ncode {\n  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',\n    monospace;\n}",
      },
    ],
  },
  {
    name: "public",
    type: "folder",
    isOpen: false,
    children: [
      {
        name: "index.html",
        type: "file",
        content:
          '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>React App</title>\n  </head>\n  <body>\n    <noscript>You need to enable JavaScript to run this app.</noscript>\n    <div id="root"></div>\n  </body>\n</html>',
      },
    ],
  },
  {
    name: "package.json",
    type: "file",
    content:
      '{\n  "name": "my-react-app",\n  "version": "0.1.0",\n  "private": true,\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0",\n    "react-scripts": "5.0.1"\n  },\n  "scripts": {\n    "start": "react-scripts start",\n    "build": "react-scripts build",\n    "test": "react-scripts test",\n    "eject": "react-scripts eject"\n  }\n}',
  },
  {
    name: "README.md",
    type: "file",
    content:
      "# My React App\n\nThis is a sample React application created with Create React App.\n\n## Available Scripts\n\nIn the project directory, you can run:\n\n### `npm start`\n\nRuns the app in development mode.\n\n### `npm run build`\n\nBuilds the app for production.",
  },
];

export function Editor() {
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [activeFile, setActiveFile] = useState<string>("src/App.tsx");
  const [openTabs, setOpenTabs] = useState<string[]>(["src/App.tsx"]);

  const toggleFolder = (path: string) => {
    const updateFiles = (nodes: FileNode[], currentPath = ""): FileNode[] => {
      return nodes.map((node) => {
        const nodePath = currentPath
          ? `${currentPath}/${node.name}`
          : node.name;
        if (nodePath === path && node.type === "folder") {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: updateFiles(node.children, nodePath) };
        }
        return node;
      });
    };
    setFiles(updateFiles(files));
  };

  const openFile = (path: string) => {
    setActiveFile(path);
    if (!openTabs.includes(path)) {
      setOpenTabs([...openTabs, path]);
    }
  };

  const closeTab = (path: string) => {
    const newTabs = openTabs.filter((tab) => tab !== path);
    setOpenTabs(newTabs);
    if (activeFile === path && newTabs.length > 0) {
      setActiveFile(newTabs[newTabs.length - 1]);
    }
  };

  const getFileContent = (path: string): string => {
    const findFile = (nodes: FileNode[], currentPath = ""): string => {
      for (const node of nodes) {
        const nodePath = currentPath
          ? `${currentPath}/${node.name}`
          : node.name;
        if (nodePath === path && node.type === "file") {
          return node.content || "";
        }
        if (node.children) {
          const result = findFile(node.children, nodePath);
          if (result) return result;
        }
      }
      return "";
    };
    return findFile(files);
  };

  const getFileLanguage = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "tsx":
      case "ts":
        return "typescript";
      case "jsx":
      case "js":
        return "javascript";
      case "css":
        return "css";
      case "html":
        return "html";
      case "json":
        return "json";
      case "md":
        return "markdown";
      default:
        return "plaintext";
    }
  };

  return (
    <div className="h-screen  text-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal">
          {/* File Management */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <FileManagement
              files={files}
              activeFile={activeFile}
              onFileSelect={openFile}
              onToggleFolder={toggleFolder}
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Editor and Preview */}
          <ResizablePanel defaultSize={80}>
            <ResizablePanelGroup direction="horizontal">
              {/* Code Editor */}
              <ResizablePanel defaultSize={60}>
                <CodeEditor
                  activeFile={activeFile}
                  openTabs={openTabs}
                  onTabSelect={setActiveFile}
                  onTabClose={closeTab}
                  getFileContent={getFileContent}
                  getFileLanguage={getFileLanguage}
                />
              </ResizablePanel>

              <ResizableHandle />

              {/* Preview and Terminal */}
              <ResizablePanel defaultSize={40}>
                <ResizablePanelGroup direction="vertical">
                  {/* Preview */}
                  <ResizablePanel defaultSize={70}>
                    <Preview />
                  </ResizablePanel>

                  <ResizableHandle />

                  {/* Terminal */}
                  <ResizablePanel defaultSize={30} minSize={20}>
                    <DockerTerminal
                      workspaceId="demo-workspace"
                      onContainerReady={(containerId) => {
                        console.log("Container ready:", containerId);
                      }}
                    />{" "}
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
