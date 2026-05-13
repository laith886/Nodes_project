"use client";

import React from "react";

export type NodeType = "fullName" | "age" | "work" | "email" | "phone" | "custom";

interface NodeListProps {
  onAddNode: (nodeType: NodeType) => void;
}

export const nodeConfig: Record<
  NodeType,
  { label: string; description: string; placeholder: string }
> = {
  fullName: {
    label: "Full Name",
    description: "Write a person's full name",
    placeholder: "Enter full name...",
  },
  age: {
    label: "Age",
    description: "Write age",
    placeholder: "Enter age...",
  },
  work: {
    label: "Work",
    description: "Write work or job title",
    placeholder: "Enter work...",
  },
  email: {
    label: "Email",
    description: "Write email address",
    placeholder: "Enter email...",
  },
  phone: {
    label: "Phone",
    description: "Write phone number",
    placeholder: "Enter phone...",
  },
  custom: {
    label: "Custom",
    description: "Write anything you want",
    placeholder: "Enter custom value...",
  },
};

export default function NodeList({ onAddNode }: NodeListProps) {
  const nodeTypes = Object.entries(nodeConfig) as [
    NodeType,
    (typeof nodeConfig)[NodeType]
  ][];

  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    e.dataTransfer.setData("nodeType", nodeType);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="w-64 bg-zinc-50 border-r border-zinc-200 p-4 dark:bg-zinc-900 dark:border-zinc-800">
      <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Available Nodes
      </h2>

      <div className="space-y-2">
        {nodeTypes.map(([type, node]) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
            onDoubleClick={() => onAddNode(type)}
            className="p-3 bg-white border border-zinc-200 rounded-lg cursor-grab hover:border-zinc-400 hover:shadow-md transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-zinc-500"
          >
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {node.label}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {node.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}