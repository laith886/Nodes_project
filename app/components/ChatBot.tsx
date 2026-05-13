"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AutomationKind,
  ChatMessage,
  Intent,
  describeIntent,
  parseIntent,
} from "./AgentLogic";
import { NodeType } from "./NodeList";

interface ChatBotProps {
  nodeCount: number;
  onAddNode: (type: NodeType) => void;
  onClearCanvas: () => void;
  onRunAutomation: (automation: AutomationKind) => void;
}

const SUGGESTIONS: string[] = [
  "Add an email node",
  "Add a full name node",
  "Run employee onboarding",
  "Clear the canvas",
];

const INITIAL_MESSAGE: ChatMessage = {
  id: "bot-welcome",
  role: "bot",
  text: "Hi! I'm your Canvas Agent. Tell me what to build — try \"add an email node\", \"run employee onboarding\", or \"clear the canvas\".",
  timestamp: 0,
};

export default function ChatBot({
  nodeCount,
  onAddNode,
  onClearCanvas,
  onRunAutomation,
}: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep the latest node count available to the async response without
  // re-triggering effects on every keystroke.
  const nodeCountRef = useRef(nodeCount);
  useEffect(() => {
    nodeCountRef.current = nodeCount;
  }, [nodeCount]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking, isOpen]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const executeIntent = (intent: Intent) => {
    switch (intent.kind) {
      case "ADD_NODE":
        onAddNode(intent.nodeType);
        return;
      case "CLEAR_CANVAS":
        onClearCanvas();
        return;
      case "RUN_AUTOMATION":
        onRunAutomation(intent.automation);
        return;
      default:
        // GREETING, HELP, UNKNOWN have no side effects on the canvas
        return;
    }
  };

  const sendMessage = (rawText: string) => {
    const text = rawText.trim();
    if (!text || isThinking) return;

    const now = Date.now();
    const userMsg: ChatMessage = {
      id: `user-${now}`,
      role: "user",
      text,
      timestamp: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const intent = parseIntent(text);
    executeIntent(intent);

    setIsThinking(true);
    // Tiny delay gives the interaction an agentic, conversational rhythm.
    window.setTimeout(() => {
      const replyText = describeIntent(intent, {
        nodeCount: nodeCountRef.current,
      });
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: replyText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsThinking(false);
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Canvas Agent"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 hover:shadow-xl transition-all dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          <ChatIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Agent</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl bg-white border border-zinc-200 shadow-2xl shadow-zinc-900/10 overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
                <SparkleIcon className="w-4 h-4" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-zinc-50 dark:border-zinc-950" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Canvas Agent
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Online · ready for commands
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white dark:bg-zinc-900"
          >
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isThinking && <TypingIndicator />}
          </div>

          <div className="px-3 pt-2 pb-1 border-t border-zinc-200 bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  disabled={isThinking}
                  className="px-2.5 py-1 text-xs rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 disabled:opacity-50 transition-colors dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 pb-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell the agent what to do…"
                disabled={isThinking}
                className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg bg-white border border-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              />
              <button
                type="submit"
                disabled={isThinking || !input.trim()}
                className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                aria-label="Send message"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
          isUser
            ? "bg-zinc-900 text-white rounded-br-sm dark:bg-white dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-900 rounded-bl-sm dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-zinc-100 dark:bg-zinc-800">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s] dark:bg-zinc-500" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s] dark:bg-zinc-500" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce dark:bg-zinc-500" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons (inline so we don't pull in an icon library)
// ---------------------------------------------------------------------------

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2zm6 11l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
