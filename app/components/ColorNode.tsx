"use client";

import React from "react";

interface ColorNodeProps {
  id: string;
  message: string;
  color: string;
}

export default function ColorNode({ id, message, color }: ColorNodeProps) {
  return (
    <div className="p-4 bg-white border border-zinc-300 rounded-lg shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 bg-purple-500 rounded-full" />
        <span className="font-medium text-zinc-900 dark:text-zinc-100">Color Node</span>
      </div>
      <div
        className="text-sm font-mono p-2 rounded"
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        {message}
      </div>
    </div>
  );
}