"use client";

import { useState } from "react";
import NodeList, { NodeType } from "./components/NodeList";
import Canvas from "./components/Canvas";

interface CanvasNode {
  id: string;
  type: NodeType;
  value: string;
  color: string;
  x: number;
  y: number;
}

export default function Home() {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);

  const handleAddNode = (nodeType: NodeType) => {
    const newNode: CanvasNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      value: "",
      color: "#8b5cf6",
      x: 40 + nodes.length * 20,
      y: 40 + nodes.length * 20,
    };

    setNodes((prev) => [...prev, newNode]);
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <NodeList onAddNode={handleAddNode} />

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Vibe Code Automation
          </h1>

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Each node has its own text and color
          </p>
        </header>

        <Canvas nodes={nodes} setNodes={setNodes} />
      </div>
    </div>
  );
}