import { NodeType, nodeConfig } from "./NodeList";

export type ChatRole = "user" | "bot";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: number;
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  value: string;
  color: string;
  x: number;
  y: number;
}

export type AutomationKind = "onboarding";

export type Intent =
  | { kind: "ADD_NODE"; nodeType: NodeType }
  | { kind: "CLEAR_CANVAS" }
  | { kind: "RUN_AUTOMATION"; automation: AutomationKind }
  | { kind: "GREETING" }
  | { kind: "HELP" }
  | { kind: "UNKNOWN"; original: string };

interface DescribeContext {
  nodeCount: number;
}

// ---------------------------------------------------------------------------
// Keyword tables
// ---------------------------------------------------------------------------

// Order matters: more specific patterns first.
const NODE_KEYWORDS: { type: NodeType; pattern: RegExp }[] = [
  { type: "fullName", pattern: /\b(full[\s-]?name|fullname|person|name)\b/i },
  { type: "email", pattern: /\b(e[-\s]?mails?|emails?|mails?)\b/i },
  { type: "phone", pattern: /\b(phones?|mobile|cell(?:phone)?|tel(?:ephone)?|number)\b/i },
  { type: "work", pattern: /\b(work|job|occupation|role|position|company)\b/i },
  { type: "age", pattern: /\b(age|years?\s+old|birthday)\b/i },
  { type: "custom", pattern: /\b(custom|other|anything|free[-\s]?form)\b/i },
];

const ADD_VERB = /\b(add|create|insert|make|new|put|place|drop|spawn|give\s+me|i\s+(?:want|need))\b/i;

const CLEAR_PATTERN =
  /\b(clear|wipe|empty|reset)\b.*\b(canvas|all|everything|nodes?|board|screen)\b|\b(delete|remove)\s+(all|everything|the\s+nodes?|every\s+node)\b|^(clear|reset|wipe)(\s+(it|all|canvas))?$/i;

const ONBOARDING_PATTERN =
  /\b(employee[-\s]?onboarding|onboarding|new\s+hire|hr\s+flow)\b/i;

const GREETING_PATTERN = /^(hi|hey|hello|yo|sup|howdy|hola)\b/i;

const HELP_PATTERN =
  /\b(help|what\s+can\s+you\s+do|commands?|how\s+do\s+(?:i|you)\s+(?:use|work)|capabilities)\b/i;

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export function parseIntent(rawText: string): Intent {
  const text = rawText.trim();
  if (!text) return { kind: "UNKNOWN", original: rawText };

  if (GREETING_PATTERN.test(text)) return { kind: "GREETING" };

  if (CLEAR_PATTERN.test(text)) return { kind: "CLEAR_CANVAS" };

  if (ONBOARDING_PATTERN.test(text)) {
    return { kind: "RUN_AUTOMATION", automation: "onboarding" };
  }

  if (HELP_PATTERN.test(text)) return { kind: "HELP" };

  // ADD_NODE: either an explicit add verb + node keyword, or "<type> node"
  const hasAddVerb = ADD_VERB.test(text);
  const mentionsNode = /\bnodes?\b/i.test(text);

  if (hasAddVerb || mentionsNode) {
    for (const { type, pattern } of NODE_KEYWORDS) {
      if (pattern.test(text)) {
        return { kind: "ADD_NODE", nodeType: type };
      }
    }
  }

  return { kind: "UNKNOWN", original: rawText };
}

// ---------------------------------------------------------------------------
// Node factories
// ---------------------------------------------------------------------------

const DEFAULT_COLOR = "#8b5cf6";

/**
 * Build a single node with a small diagonal stagger based on how many nodes
 * already exist. Mirrors the original page handler so behaviour is consistent
 * whether the user clicks the sidebar or asks the bot.
 */
export function createNode(type: NodeType, existingCount: number): CanvasNode {
  return {
    id: `${type}-${Date.now()}`,
    type,
    value: "",
    color: DEFAULT_COLOR,
    x: 40 + existingCount * 20,
    y: 40 + existingCount * 20,
  };
}

/**
 * Build a sequence of nodes laid out horizontally so they do not overlap.
 * Each new automation run nudges the row slightly so successive runs are
 * still distinguishable.
 */
export function createAutomationNodes(
  types: NodeType[],
  existingCount: number
): CanvasNode[] {
  // Node width is w-72 (~288px); ~330px keeps a comfortable gap.
  const NODE_SLOT = 330;
  const baseX = 60;
  const baseY = 80 + (existingCount % 8) * 24;
  const timestamp = Date.now();

  return types.map((type, idx) => ({
    id: `${type}-${timestamp}-${idx}`,
    type,
    value: "",
    color: DEFAULT_COLOR,
    x: baseX + idx * NODE_SLOT,
    y: baseY,
  }));
}

// ---------------------------------------------------------------------------
// Automations
// ---------------------------------------------------------------------------

export const AUTOMATIONS: Record<
  AutomationKind,
  { label: string; nodes: NodeType[] }
> = {
  onboarding: {
    label: "Employee Onboarding",
    nodes: ["fullName", "email", "work"],
  },
};

// ---------------------------------------------------------------------------
// Response generator
// ---------------------------------------------------------------------------

const HELP_TEXT = [
  "Here is what I can do:",
  "• Add a node — e.g. \"add an email node\", \"create a full name node\"",
  "• Run an automation — e.g. \"run employee onboarding\"",
  "• Clear the canvas — e.g. \"clear the canvas\", \"delete all\"",
].join("\n");

export function describeIntent(intent: Intent, ctx: DescribeContext): string {
  switch (intent.kind) {
    case "ADD_NODE": {
      const label = nodeConfig[intent.nodeType].label;
      const article = /^[aeiou]/i.test(label) ? "an" : "a";
      return `Added ${article} ${label} node for you.`;
    }
    case "CLEAR_CANVAS": {
      if (ctx.nodeCount === 0) return "The canvas is already empty.";
      const word = ctx.nodeCount === 1 ? "node" : "nodes";
      return `Cleared the canvas — removed ${ctx.nodeCount} ${word}.`;
    }
    case "RUN_AUTOMATION": {
      const auto = AUTOMATIONS[intent.automation];
      const labels = auto.nodes.map((t) => nodeConfig[t].label).join(", ");
      return `Running the ${auto.label} automation. Added: ${labels}.`;
    }
    case "GREETING":
      return "Hey! Tell me what to put on the canvas — for example: \"add a phone node\" or \"run employee onboarding\".";
    case "HELP":
      return HELP_TEXT;
    case "UNKNOWN":
    default:
      return "I didn't catch that. You can ask me to add a node (full name, age, work, email, phone, custom), run the employee onboarding automation, or clear the canvas.";
  }
}
