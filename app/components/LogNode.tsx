"use client";

import React from "react";

interface LogNodeProps {
  id: string;
  message: string;
}

export default function LogNode({ id, message }: LogNodeProps) {
  return (
    <div className="p-4 bg-white border border-zinc-300 rounded-lg shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full" />
        <span className="font-medium text-zinc-900 dark:text-zinc-100">Log Node</span>
      </div>
      <div className="text-sm text-zinc-600 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-900 p-2 rounded">
        {message}
      </div>
    </div>
  );
}