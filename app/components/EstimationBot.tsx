"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ComplexityCounts,
  ECF_FACTOR_DEFINITIONS,
  EstimationInput,
  EstimationResult,
  FactorDefinition,
  FunctionPointData,
  TCF_FACTOR_DEFINITIONS,
  VAF_FACTOR_DEFINITIONS,
  createEmptyEstimationInput,
} from "@/types/estimation";
import {
  clampRating,
  formatCurrency,
  formatHours,
  runEstimation,
} from "@/utils/estimationEngine";
import { generateEstimationReport } from "@/utils/pdfGenerator";

type WizardStep =
  | "welcome"
  | "project_name"
  | "ucp_actors"
  | "ucp_use_cases"
  | "ucp_tcf"
  | "ucp_ecf"
  | "fp_functions"
  | "fp_vaf"
  | "rates"
  | "summary";

const STEP_ORDER: WizardStep[] = [
  "welcome",
  "project_name",
  "ucp_actors",
  "ucp_use_cases",
  "ucp_tcf",
  "ucp_ecf",
  "fp_functions",
  "fp_vaf",
  "rates",
  "summary",
];

const STEP_PROMPTS: Record<WizardStep, string> = {
  welcome:
    "Welcome! I'm your Software Estimation Expert. I'll guide you through a Function Point (IFPUG) and Use Case Point analysis to estimate project size, effort, and cost.\n\nClick **Start Interview** when you're ready.",
  project_name: "Let's begin. What is the **project name**?",
  ucp_actors:
    "We'll start with **Use Case Points**. How many **actors** does the system have at each complexity?\n\n• **Simple** — external API\n• **Average** — protocol-driven interface\n• **Complex** — graphical UI",
  ucp_use_cases:
    "Now count the **use cases** at each complexity level:\n\n• **Simple** — ≤3 transactions\n• **Average** — 4–7 transactions\n• **Complex** — >7 transactions",
  ucp_tcf:
    "Rate each **Technical Complexity Factor (TCF)** from **0** (no influence) to **5** (essential). Defaults are 3 (average).",
  ucp_ecf:
    "Rate each **Environmental Complexity Factor (ECF)** from **0** to **5**. Higher ratings reduce the ECF multiplier (less experienced team).",
  fp_functions:
    "Time for **Function Points**. Enter the count of each function type at Simple / Average / Complex complexity (IFPUG weights apply automatically).",
  fp_vaf:
    "Rate the **14 General System Characteristics (VAF)** from **0** to **5** for the Value Adjustment Factor.",
  rates:
    "Almost done! Set your **productivity** and **cost** assumptions:",
  summary: "Here is your complete estimation summary:",
};

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: number;
}

function nextStep(current: WizardStep): WizardStep | null {
  const idx = STEP_ORDER.indexOf(current);
  return idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null;
}

function parseNonNegativeInt(value: string): number {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parsePositiveFloat(value: string, fallback: number): number {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function buildSummaryText(r: EstimationResult): string {
  const sym = r.parameters.currencySymbol;
  return [
    `**${r.projectName}** — Estimation Complete`,
    "",
    "**Size**",
    `• Adjusted Function Points: **${r.functionPoints.adjustedFP.toFixed(1)} FP** (UFP ${r.functionPoints.ufp}, VAF ×${r.functionPoints.vafMultiplier.toFixed(3)})`,
    `• Adjusted Use Case Points: **${r.useCasePoints.adjustedUCP.toFixed(1)} UCP** (UUCP ${r.useCasePoints.uucp}, TCF ${r.useCasePoints.tcf.toFixed(3)}, ECF ${r.useCasePoints.ecf.toFixed(3)})`,
    "",
    "**Effort** (blended average of FP & UCP methods)",
    `• ${formatHours(r.effort.blendedHours)} — ${r.effort.blendedPersonDays.toFixed(1)} person-days`,
    "",
    "**Cost** (blended)",
    `• ${formatCurrency(r.cost.blendedCost, sym)} at ${formatCurrency(r.parameters.hourlyRate, sym)}/hour`,
    "",
    "Download the full PDF report below for detailed input tables.",
  ].join("\n");
}

export default function EstimationBot() {
  const [step, setStep] = useState<WizardStep>("welcome");
  const [data, setData] = useState<EstimationInput>(createEmptyEstimationInput);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [results, setResults] = useState<EstimationResult | null>(null);
  const [initialized, setInitialized] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const pushBot = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}-${Math.random()}`,
        role: "bot",
        text,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const pushUser = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const goToStep = useCallback(
    (target: WizardStep) => {
      setStep(target);
      pushBot(STEP_PROMPTS[target]);
    },
    [pushBot]
  );

  const advanceFrom = useCallback(
    (current: WizardStep, userSummary?: string) => {
      if (userSummary) pushUser(userSummary);
      const next = nextStep(current);
      if (!next) return;
      goToStep(next);
    },
    [goToStep, pushUser]
  );

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      pushBot(STEP_PROMPTS.welcome);
    }
  }, [initialized, pushBot]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, step]);

  const handleStart = () => {
    pushUser("Start Interview");
    goToStep("project_name");
  };

  const handleProjectName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setData((d) => ({ ...d, projectName: trimmed }));
    advanceFrom("project_name", trimmed);
  };

  const handleActorCounts = (counts: ComplexityCounts) => {
    setData((d) => ({
      ...d,
      useCasePoints: { ...d.useCasePoints, actors: counts },
    }));
    advanceFrom(
      "ucp_actors",
      `Actors — Simple: ${counts.simple}, Average: ${counts.average}, Complex: ${counts.complex}`
    );
  };

  const handleUseCaseCounts = (counts: ComplexityCounts) => {
    setData((d) => ({
      ...d,
      useCasePoints: { ...d.useCasePoints, useCases: counts },
    }));
    advanceFrom(
      "ucp_use_cases",
      `Use Cases — Simple: ${counts.simple}, Average: ${counts.average}, Complex: ${counts.complex}`
    );
  };

  const handleTCF = (tcf: EstimationInput["useCasePoints"]["tcf"]) => {
    setData((d) => ({
      ...d,
      useCasePoints: { ...d.useCasePoints, tcf },
    }));
    advanceFrom("ucp_tcf", "TCF factors submitted (13 ratings).");
  };

  const handleECF = (ecf: EstimationInput["useCasePoints"]["ecf"]) => {
    setData((d) => ({
      ...d,
      useCasePoints: { ...d.useCasePoints, ecf },
    }));
    advanceFrom("ucp_ecf", "ECF factors submitted (8 ratings).");
  };

  const handleFPFunctions = (fp: FunctionPointData) => {
    setData((d) => ({ ...d, functionPoints: fp }));
    advanceFrom("fp_functions", "Function point counts submitted.");
  };

  const handleVAF = (vaf: EstimationInput["vaf"]) => {
    setData((d) => ({ ...d, vaf }));
    advanceFrom("fp_vaf", "VAF factors submitted (14 ratings).");
  };

  const handleRates = (params: EstimationInput["parameters"]) => {
    const updated: EstimationInput = { ...data, parameters: params };
    setData(updated);
    pushUser(
      `Rate: ${params.hourlyRate}/h · ${params.hoursPerFP} h/FP · ${params.hoursPerUCP} h/UCP`
    );
    const computed = runEstimation(updated);
    setResults(computed);
    setStep("summary");
    pushBot(STEP_PROMPTS.summary);
    pushBot(buildSummaryText(computed));
  };

  const handleDownloadPdf = () => {
    if (!results) return;
    generateEstimationReport(data, results);
  };

  const handleRestart = () => {
    setData(createEmptyEstimationInput());
    setResults(null);
    setMessages([]);
    setStep("welcome");
    setInitialized(false);
    window.setTimeout(() => setInitialized(true), 0);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-50 dark:bg-zinc-950">
      <header className="shrink-0 px-4 py-3 border-b border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Software Estimation Expert
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Function Point &amp; Use Case Point analysis
        </p>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {step === "welcome" && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleStart}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors"
            >
              Start Interview
            </button>
          </div>
        )}

        {step === "project_name" && (
          <ProjectNameForm onSubmit={handleProjectName} />
        )}
        {step === "ucp_actors" && (
          <ComplexityCountForm
            title="Actor counts"
            onSubmit={handleActorCounts}
          />
        )}
        {step === "ucp_use_cases" && (
          <ComplexityCountForm
            title="Use case counts"
            onSubmit={handleUseCaseCounts}
          />
        )}
        {step === "ucp_tcf" && (
          <FactorRatingForm
            factors={TCF_FACTOR_DEFINITIONS}
            initial={data.useCasePoints.tcf as Record<string, number>}
            onSubmit={(ratings) =>
              handleTCF(ratings as EstimationInput["useCasePoints"]["tcf"])
            }
          />
        )}
        {step === "ucp_ecf" && (
          <FactorRatingForm
            factors={ECF_FACTOR_DEFINITIONS}
            initial={data.useCasePoints.ecf as Record<string, number>}
            onSubmit={(ratings) =>
              handleECF(ratings as EstimationInput["useCasePoints"]["ecf"])
            }
          />
        )}
        {step === "fp_functions" && (
          <FunctionPointForm
            initial={data.functionPoints}
            onSubmit={handleFPFunctions}
          />
        )}
        {step === "fp_vaf" && (
          <FactorRatingForm
            factors={VAF_FACTOR_DEFINITIONS}
            initial={data.vaf as Record<string, number>}
            onSubmit={(ratings) =>
              handleVAF(ratings as EstimationInput["vaf"])
            }
          />
        )}
        {step === "rates" && (
          <RatesForm initial={data.parameters} onSubmit={handleRates} />
        )}

        {step === "summary" && results && (
          <div className="flex flex-col gap-2 items-start pb-4">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors shadow-sm"
            >
              Download PDF Report
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            >
              Start new estimation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const lines = message.text.split("\n");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-zinc-900 text-white rounded-br-sm dark:bg-white dark:text-zinc-900"
            : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-sm shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
        }`}
      >
        {lines.map((line, i) => (
          <p key={i} className={i > 0 ? "mt-1.5" : ""}>
            {renderInlineBold(line)}
          </p>
        ))}
      </div>
    </div>
  );
}

function renderInlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormCard({
  children,
  onSubmit,
  submitLabel = "Continue",
}: {
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
    >
      {children}
      <button
        type="submit"
        className="mt-4 w-full py-2 text-sm font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function ProjectNameForm({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <FormCard onSubmit={() => onSubmit(name)} submitLabel="Continue">
      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
        Project name
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. CRM Portal"
        autoFocus
        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-600 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
      />
    </FormCard>
  );
}

function ComplexityCountForm({
  title,
  onSubmit,
}: {
  title: string;
  onSubmit: (counts: ComplexityCounts) => void;
}) {
  const [simple, setSimple] = useState("0");
  const [average, setAverage] = useState("0");
  const [complex, setComplex] = useState("0");

  return (
    <FormCard
      onSubmit={() =>
        onSubmit({
          simple: parseNonNegativeInt(simple),
          average: parseNonNegativeInt(average),
          complex: parseNonNegativeInt(complex),
        })
      }
    >
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-3">
        {title}
      </p>
      <div className="grid grid-cols-3 gap-3">
        <NumberField label="Simple" value={simple} onChange={setSimple} />
        <NumberField label="Average" value={average} onChange={setAverage} />
        <NumberField label="Complex" value={complex} onChange={setComplex} />
      </div>
    </FormCard>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-sm rounded-lg border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
      />
    </div>
  );
}

function FactorRatingForm({
  factors,
  initial,
  onSubmit,
}: {
  factors: FactorDefinition[];
  initial: Record<string, number>;
  onSubmit: (ratings: Record<string, number>) => void;
}) {
  const [ratings, setRatings] = useState<Record<string, number>>(() => ({
    ...initial,
  }));

  const setRating = (id: string, value: number) => {
    setRatings((prev) => ({ ...prev, [id]: clampRating(value) }));
  };

  return (
    <FormCard
      onSubmit={() => {
        const normalized: Record<string, number> = {};
        for (const f of factors) {
          normalized[f.id] = clampRating(ratings[f.id] ?? 3);
        }
        onSubmit(normalized);
      }}
    >
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
        Rate each factor 0–5. Use quick presets:
      </p>
      <div className="flex gap-2 mb-3">
        {[0, 3, 5].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              const next: Record<string, number> = {};
              for (const f of factors) next[f.id] = preset;
              setRatings(next);
            }}
            className="px-2 py-1 text-xs rounded-md border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
          >
            All {preset}
          </button>
        ))}
      </div>
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {factors.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between gap-2 py-1 border-b border-zinc-100 dark:border-zinc-700 last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {f.label}
              </p>
              <p className="text-[10px] text-zinc-400 truncate">{f.description}</p>
            </div>
            <input
              type="number"
              min={0}
              max={5}
              value={ratings[f.id] ?? 3}
              onChange={(e) => setRating(f.id, parseInt(e.target.value, 10))}
              className="w-14 px-2 py-1 text-sm text-center rounded-lg border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
            />
          </div>
        ))}
      </div>
    </FormCard>
  );
}

const FP_ROWS: { key: keyof FunctionPointData; label: string }[] = [
  { key: "ei", label: "External Inputs (EI)" },
  { key: "eo", label: "External Outputs (EO)" },
  { key: "eq", label: "External Inquiries (EQ)" },
  { key: "ilf", label: "Internal Logical Files (ILF)" },
  { key: "eif", label: "External Interface Files (EIF)" },
];

function FunctionPointForm({
  initial,
  onSubmit,
}: {
  initial: FunctionPointData;
  onSubmit: (fp: FunctionPointData) => void;
}) {
  const [fp, setFp] = useState<FunctionPointData>(initial);

  const update = (
    key: keyof FunctionPointData,
    field: keyof ComplexityCounts,
    value: string
  ) => {
    setFp((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: parseNonNegativeInt(value) },
    }));
  };

  return (
    <FormCard onSubmit={() => onSubmit(fp)} submitLabel="Submit function counts">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-zinc-500">
              <th className="pb-2 pr-2">Type</th>
              <th className="pb-2 px-1">S</th>
              <th className="pb-2 px-1">A</th>
              <th className="pb-2 px-1">C</th>
            </tr>
          </thead>
          <tbody>
            {FP_ROWS.map(({ key, label }) => (
              <tr key={key} className="border-t border-zinc-100 dark:border-zinc-700">
                <td className="py-1.5 pr-2 font-medium text-zinc-800 dark:text-zinc-200">
                  {label}
                </td>
                {(["simple", "average", "complex"] as const).map((field) => (
                  <td key={field} className="py-1 px-1">
                    <input
                      type="number"
                      min={0}
                      value={fp[key][field]}
                      onChange={(e) => update(key, field, e.target.value)}
                      className="w-12 px-1 py-1 text-center rounded border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FormCard>
  );
}

function RatesForm({
  initial,
  onSubmit,
}: {
  initial: EstimationInput["parameters"];
  onSubmit: (params: EstimationInput["parameters"]) => void;
}) {
  const [hourlyRate, setHourlyRate] = useState(String(initial.hourlyRate));
  const [hoursPerFP, setHoursPerFP] = useState(String(initial.hoursPerFP));
  const [hoursPerUCP, setHoursPerUCP] = useState(String(initial.hoursPerUCP));

  return (
    <FormCard onSubmit={() => onSubmit({
      ...initial,
      hourlyRate: parsePositiveFloat(hourlyRate, 50),
      hoursPerFP: parsePositiveFloat(hoursPerFP, 20),
      hoursPerUCP: parsePositiveFloat(hoursPerUCP, 20),
    })} submitLabel="Calculate estimation">
      <div className="space-y-3">
        <LabeledInput
          label="Hourly rate ($)"
          value={hourlyRate}
          onChange={setHourlyRate}
          step="1"
        />
        <LabeledInput
          label="Hours per Function Point"
          value={hoursPerFP}
          onChange={setHoursPerFP}
          step="0.5"
        />
        <LabeledInput
          label="Hours per Use Case Point"
          value={hoursPerUCP}
          onChange={setHoursPerUCP}
          step="0.5"
        />
      </div>
    </FormCard>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step: string;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
      <input
        type="number"
        min={0.1}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
      />
    </div>
  );
}


