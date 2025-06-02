"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronRight, File, Folder, FolderOpen, Plus } from "lucide-react"

export interface FileNode {
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  content?: string
  isOpen?: boolean
}

interface FileManagementProps {
  files: FileNode[]
  activeFile: string
  onFileSelect: (path: string) => void
  onToggleFolder: (path: string) => void
}

export function FileManagement({ files, activeFile, onFileSelect, onToggleFolder }: FileManagementProps) {
  const renderFileTree = (nodes: FileNode[], level = 0, currentPath = ""): React.ReactNode => {
    return nodes.map((node, index) => {
      const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name
      const isActive = activeFile === nodePath

      return (
        <div key={index}>
          <div
            className={`flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-gray-800 ${
              isActive ? "bg-gray-700 text-blue-400" : "text-gray-300"
            }`}
            style={{ paddingLeft: `${8 + level * 16}px` }}
            onClick={() => {
              if (node.type === "folder") {
                onToggleFolder(nodePath)
              } else {
                onFileSelect(nodePath)
              }
            }}
          >
            {node.type === "folder" ? (
              <>
                {node.isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {node.isOpen ? (
                  <FolderOpen className="w-4 h-4 text-blue-400" />
                ) : (
                  <Folder className="w-4 h-4 text-blue-400" />
                )}
              </>
            ) : (
              <>
                <div className="w-4" />
                <File className="w-4 h-4 text-gray-400" />
              </>
            )}
            <span className="truncate">{node.name}</span>
          </div>
          {node.type === "folder" && node.isOpen && node.children && (
            <div>{renderFileTree(node.children, level + 1, nodePath)}</div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="h-full bg-gray-900 border-r border-gray-700">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-300">EXPLORER</span>
          <Button variant="ghost" size="sm" className="w-6 h-6 p-0 text-gray-400 hover:text-white">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1">{renderFileTree(files)}</div>
      </ScrollArea>
    </div>
  )
}
