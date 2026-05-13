# Vibe Code Automation — Agentic Node Canvas

An interactive node-based canvas with a built-in **Agentic UI ChatBot**. Drag-and-drop nodes from a sidebar, or just _tell the agent_ what to build using natural language — "add an email node", "run employee onboarding", "clear the canvas".

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

> Software Engineering — Assignment 2: *Agentic UI ChatBot*

---

## Table of Contents

- [Features](#features)
- [Demo Commands](#demo-commands)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [How the NLP Parser Works](#how-the-nlp-parser-works)
- [Extending the Bot](#extending-the-bot)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- **Node sidebar** with six node types: Full Name, Age, Work, Email, Phone, and Custom.
- **Drag-and-drop canvas** — drop nodes anywhere, edit their value, pick a color, or delete them.
- **Agentic ChatBot** (bottom-right) that parses plain English and manipulates the canvas:
  - Add nodes by type — `"add an email node"`, `"i want a phone"`
  - Run multi-node automations — `"run employee onboarding"` spawns Full Name → Email → Work in a non-overlapping row
  - Clear the canvas — `"clear all"`, `"delete all"`, `"wipe everything"`
  - Help and greetings handled gracefully
- **Offline / instant** — no API keys, no network calls. The parser is a deterministic regex/keyword engine.
- **Dark mode** — fully themed via Tailwind's `dark:` variants and `prefers-color-scheme`.
- **Strict TypeScript** — discriminated unions for intents, no `any`.

---

## Demo Commands

Open the chat panel and try:

| You say                           | Bot does                                                |
| --------------------------------- | ------------------------------------------------------- |
| `add an email node`               | Spawns one Email node                                   |
| `create a full name node`         | Spawns one Full Name node                               |
| `i want a phone`                  | Spawns one Phone node                                   |
| `give me a custom node`           | Spawns one Custom node                                  |
| `run employee onboarding`         | Spawns Full Name + Email + Work side-by-side            |
| `clear the canvas` / `delete all` | Removes every node                                      |
| `help`                            | Lists every supported command                           |
| `hi` / `hello`                    | Friendly greeting, no canvas change                     |
| `make me a sandwich`              | Graceful fallback explaining what the bot _can_ do      |

---

## Tech Stack

| Layer           | Choice                                  |
| --------------- | --------------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack)      |
| UI runtime      | React 19                                |
| Language        | TypeScript 5 (strict)                   |
| Styling         | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Fonts           | `next/font` — Geist & Geist Mono        |
| Linting         | ESLint 9 + `eslint-config-next`         |

---

## Getting Started

### Prerequisites

- **Node.js** 18.18 or newer (20+ recommended)
- **npm** 9+ (ships with Node)

### Install & Run

```bash
git clone <your-repo-url>
cd Nodes_project
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the page hot-reloads on save.

---

## Available Scripts

| Command            | What it does                                                       |
| ------------------ | ------------------------------------------------------------------ |
| `npm run dev`      | Start the development server with hot reload                       |
| `npm run build`    | Production build (also the strictest type-check Next.js runs)      |
| `npm start`        | Serve the production build (run `build` first)                     |
| `npm run lint`     | Run ESLint over the codebase                                       |
| `npx tsc --noEmit` | Pure TypeScript check, no build output                             |

---

## Project Structure

```
Nodes_project/
├── app/
│   ├── components/
│   │   ├── AgentLogic.ts        # Intent parser + node factories (pure, no React)
│   │   ├── Canvas.tsx           # Drop zone + renders EditableNodes
│   │   ├── ChatBot.tsx          # Floating chat UI
│   │   ├── ColorNode.tsx        # (legacy demo node)
│   │   ├── EditableNode.tsx     # The actual interactive node card
│   │   ├── LogNode.tsx          # (legacy demo node)
│   │   └── NodeList.tsx         # Sidebar with node types + nodeConfig
│   ├── globals.css              # Tailwind import + CSS variables
│   ├── layout.tsx               # Root layout, font wiring
│   └── page.tsx                 # The controller — owns `nodes` state
├── public/                      # Static assets
├── AGENTS.md                    # Repo-wide agent rules
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md                    # ← you are here
```

---

## Architecture

```
                       page.tsx (Controller)
                       owns: nodes: CanvasNode[]
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   NodeList.tsx          Canvas.tsx            ChatBot.tsx
   drag/dbl-click        drop / edit /         natural-language
   → onAddNode           remove nodes          → callbacks
                                                      │
                                                      ▼
                                              AgentLogic.ts
                                              (pure parser + factories)
```

**Three clean layers**, by design:

1. **State** lives in `page.tsx` (the controller). It owns `nodes` and exposes three callbacks: `onAddNode`, `onClearCanvas`, `onRunAutomation`.
2. **Logic** lives in `AgentLogic.ts`. Zero React imports — easy to unit-test with plain Vitest/Jest.
3. **UI** lives in `ChatBot.tsx`. It only renders messages and dispatches callbacks; it never touches `setNodes` directly.

This separation means you can swap the regex parser for a real LLM later by changing _only_ `AgentLogic.ts`.

---

## How the NLP Parser Works

`parseIntent(text)` returns a discriminated union:

```ts
type Intent =
  | { kind: "ADD_NODE"; nodeType: NodeType }
  | { kind: "CLEAR_CANVAS" }
  | { kind: "RUN_AUTOMATION"; automation: AutomationKind }
  | { kind: "GREETING" }
  | { kind: "HELP" }
  | { kind: "UNKNOWN"; original: string };
```

Patterns are tested **most-specific first** to avoid false positives:

1. **Greeting** — `hi / hey / hello / yo / sup …`
2. **Clear canvas** — `clear/wipe/empty/reset` near `canvas/all/nodes/board`, or `delete all`, or bare `clear`
3. **Automation** — `employee onboarding`, `new hire`, `hr flow`, `onboarding`
4. **Help** — `help`, `what can you do`, `commands`, `capabilities`
5. **Add node** — an add-verb (`add/create/insert/make/place/give me/i want/i need`) **or** the word `node`, _then_ a node-type keyword

Node-type keywords are checked **email/phone/work/age/custom before fullName**, because the generic `name` keyword belongs to `fullName` and would otherwise swallow phrases like _"phone number"_.

### Node Factories

| Function                                       | When it's used                | Behavior                                                                  |
| ---------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `createNode(type, existingCount)`              | Sidebar + single bot adds     | Diagonal stagger: `x = 40 + n·20`, `y = 40 + n·20`                        |
| `createAutomationNodes(types, existingCount)`  | Multi-node automations        | Horizontal row, 330 px slot (≈42 px gap); each run nudges vertically      |

Both produce nodes with unique IDs (`${type}-${Date.now()}` plus index for batches), the default violet color, and empty values ready for user input.

---

## Extending the Bot

### Add a new node type

1. Add it to `NodeType` and `nodeConfig` in `app/components/NodeList.tsx`.
2. Add a keyword row to `NODE_KEYWORDS` in `app/components/AgentLogic.ts`.

That's it — the controller, factories, and UI pick it up automatically.

### Add a new automation

1. Add an entry to `AUTOMATIONS` in `AgentLogic.ts`:
   ```ts
   export const AUTOMATIONS: Record<AutomationKind, { label: string; nodes: NodeType[] }> = {
     onboarding: { label: "Employee Onboarding", nodes: ["fullName", "email", "work"] },
     interview:  { label: "Interview Setup",    nodes: ["fullName", "phone", "email"] },
   };
   ```
2. Extend `AutomationKind` and add a regex branch to `parseIntent`.

### Swap the parser for an LLM

Replace the body of `parseIntent` (and optionally `describeIntent`) with an `async` call to your provider of choice. The UI already awaits the response indirectly through the typing indicator — you'll just need to convert the call site to `await`.

---

## Testing

There is no test runner wired in yet, but `AgentLogic.ts` is deliberately pure so it's trivial to add one:

```bash
npm i -D vitest
```

Add to `package.json`:

```json
"scripts": {
  "test": "vitest"
}
```

Create `app/components/AgentLogic.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseIntent } from "./AgentLogic";

describe("parseIntent", () => {
  it("detects ADD_NODE for email", () => {
    expect(parseIntent("add an email node")).toEqual({
      kind: "ADD_NODE",
      nodeType: "email",
    });
  });

  it("detects RUN_AUTOMATION for onboarding", () => {
    expect(parseIntent("run employee onboarding")).toMatchObject({
      kind: "RUN_AUTOMATION",
      automation: "onboarding",
    });
  });

  it("detects CLEAR_CANVAS for 'delete all'", () => {
    expect(parseIntent("delete all").kind).toBe("CLEAR_CANVAS");
  });

  it("returns UNKNOWN for gibberish", () => {
    expect(parseIntent("make me a sandwich").kind).toBe("UNKNOWN");
  });
});
```

Run with `npm test`.

### Manual QA Checklist

- [ ] Each node-type keyword spawns the correct node
- [ ] `run employee onboarding` produces three nodes in a horizontal row with no overlap
- [ ] Running onboarding twice offsets the second row vertically
- [ ] `clear` on an empty canvas replies *"The canvas is already empty."*
- [ ] Sidebar drag-and-drop still works exactly as before
- [ ] Toggling OS dark mode re-themes the canvas **and** the chat panel
- [ ] Suggestion chips become disabled while the typing indicator is visible

---

## Troubleshooting

**`Could not find a declaration file for module 'react'`**

You have a stray `node_modules/react` in a parent directory (commonly your user home), and the project's own `node_modules` isn't installed. Run `npm install` in this project. To stop it happening again, remove the stray install — e.g. on Windows:

```powershell
Remove-Item -Recurse -Force $HOME\node_modules
```

**Bot doesn't respond to a command you expected it to handle**

Open `app/components/AgentLogic.ts` and look at the regex tables — they're tiny and self-documenting. The order of `NODE_KEYWORDS` matters; more specific patterns must come before more general ones.

**Nodes spawn off-screen**

The position math in `createNode` is `40 + n·20`. After ~30 nodes the stagger walks off the visible area. The canvas has `overflow-auto`, so you can still scroll to them. If you'd like wrap-around, change `createNode` to `(n % 12)` for the multiplier.

---

## License

This project was built as coursework for a university Software Engineering class. Use freely for educational purposes.
