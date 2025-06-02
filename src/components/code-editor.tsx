"use client"

import { Button } from "@/components/ui/button"
import { File, X } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">Loading editor...</div>
  ),
})

interface CodeEditorProps {
  activeFile: string
  openTabs: string[]
  onTabSelect: (path: string) => void
  onTabClose: (path: string) => void
  getFileContent: (path: string) => string
  getFileLanguage: (filename: string) => string
}

export function CodeEditor({
  activeFile,
  openTabs,
  onTabSelect,
  onTabClose,
  getFileContent,
  getFileLanguage,
}: CodeEditorProps) {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {openTabs.map((tab) => (
          <div
            key={tab}
            className={`flex items-center gap-2 px-3 py-2 text-sm border-r border-gray-700 cursor-pointer min-w-0 ${
              activeFile === tab ? "bg-gray-900 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            onClick={() => onTabSelect(tab)}
          >
            <File className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{tab.split("/").pop()}</span>
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation()
                onTabClose(tab)
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        {activeFile ? (
          <MonacoEditor
            height="100%"
            language={getFileLanguage(activeFile)}
            value={getFileContent(activeFile)}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: "on",
              contextmenu: false,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">Select a file to start editing</div>
        )}
      </div>
    </div>
  )
}
