"use client";

import React from "react";
import { NodeType, nodeConfig } from "./NodeList";

interface EditableNodeProps {
  id: string;
  type: NodeType;
  value: string;
  color: string;
  onChangeValue: (id: string, value: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onRemove: (id: string) => void;
}

const colorOptions = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#000000",
];

export default function EditableNode({
  id,
  type,
  value,
  color,
  onChangeValue,
  onChangeColor,
  onRemove,
}: EditableNodeProps) {
  const config = nodeConfig[type];

  return (
    <div className="relative group w-72 p-4 bg-white border border-zinc-300 rounded-xl shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
      <button
        onClick={() => onRemove(id)}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600"
      >
        ×
      </button>

      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {config.label}
        </span>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChangeValue(id, e.target.value)}
        placeholder={config.placeholder}
        className="w-full px-3 py-2 mb-3 border border-zinc-300 rounded-lg text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
      />

      <div className="flex flex-wrap gap-2">
        {colorOptions.map((item) => (
          <button
            key={item}
            onClick={() => onChangeColor(id, item)}
            className={`w-6 h-6 rounded-full border-2 ${
              color === item ? "border-zinc-900 dark:border-white" : "border-transparent"
            }`}
            style={{ backgroundColor: item }}
          />
        ))}
      </div>

      <div
        className="mt-3 text-sm font-mono p-2 rounded"
        style={{
          backgroundColor: `${color}15`,
          color,
        }}
      >
        {value || config.placeholder}
      </div>
    </div>
  );
}