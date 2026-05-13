"use client";

import { useCallback, useState } from "react";
import NodeList, { NodeType } from "./components/NodeList";
import Canvas from "./components/Canvas";
import ChatBot from "./components/ChatBot";
import {
  AUTOMATIONS,
  AutomationKind,
  CanvasNode,
  createAutomationNodes,
  createNode,
} from "./components/AgentLogic";

export default function Home() {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);

  const handleAddNode = useCallback((nodeType: NodeType) => {
    setNodes((prev) => [...prev, createNode(nodeType, prev.length)]);
  }, []);

  const handleClearCanvas = useCallback(() => {
    setNodes([]);
  }, []);

  const handleRunAutomation = useCallback((automation: AutomationKind) => {
    const { nodes: types } = AUTOMATIONS[automation];
    setNodes((prev) => [...prev, ...createAutomationNodes(types, prev.length)]);
  }, []);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <NodeList onAddNode={handleAddNode} />

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Vibe Code Automation
          </h1>

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Drag from the sidebar or chat with the Agent
          </p>
        </header>

        <Canvas nodes={nodes} setNodes={setNodes} />
      </div>

      <ChatBot
        nodeCount={nodes.length}
        onAddNode={handleAddNode}
        onClearCanvas={handleClearCanvas}
        onRunAutomation={handleRunAutomation}
      />
    </div>
  );
}
