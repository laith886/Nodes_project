"use client";

import React, { useState, useCallback } from "react";
import EditableNode from "./EditableNode";
import { NodeType, nodeConfig } from "./NodeList";

interface CanvasNode {
  id: string;
  type: NodeType;
  value: string;
  color: string;
  x: number;
  y: number;
}

interface CanvasProps {
  nodes: CanvasNode[];
  setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
}

export default function Canvas({ nodes, setNodes }: CanvasProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const nodeType = e.dataTransfer.getData("nodeType") as NodeType;

      if (!nodeType) return;

      const rect = e.currentTarget.getBoundingClientRect();

      const newNode: CanvasNode = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        value: "",
        color: "#8b5cf6",
        x: e.clientX - rect.left - 140,
        y: e.clientY - rect.top - 40,
      };

      setNodes((prev) => [...prev, newNode]);
    },
    [setNodes]
  );

  const updateNodeValue = useCallback(
    (id: string, value: string) => {
      setNodes((prev) =>
        prev.map((node) => (node.id === id ? { ...node, value } : node))
      );
    },
    [setNodes]
  );

  const updateNodeColor = useCallback(
    (id: string, color: string) => {
      setNodes((prev) =>
        prev.map((node) => (node.id === id ? { ...node, color } : node))
      );
    },
    [setNodes]
  );

  const removeNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== id));
    },
    [setNodes]
  );

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-4 p-4 bg-zinc-50 border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        <button
          onClick={() => setNodes([])}
          className="px-3 py-1.5 text-sm bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Clear Canvas
        </button>

        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Drag nodes from the sidebar, then edit each node separately.
        </span>
      </div>

      <div
        className="flex-1 relative bg-zinc-100 dark:bg-zinc-950 overflow-auto"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-zinc-400 dark:text-zinc-500">
              <p className="text-lg mb-2">Drop nodes here</p>
              <p className="text-sm">
                Drag Full Name, Age, Work, Email, Phone or Custom nodes
              </p>
            </div>
          </div>
        )}

        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute"
            style={{
              left: Math.max(0, node.x),
              top: Math.max(0, node.y),
            }}
          >
            <EditableNode
              id={node.id}
              type={node.type}
              value={node.value}
              color={node.color}
              onChangeValue={updateNodeValue}
              onChangeColor={updateNodeColor}
              onRemove={removeNode}
            />
          </div>
        ))}
      </div>
    </div>
  );
}