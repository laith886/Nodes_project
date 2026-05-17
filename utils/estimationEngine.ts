import {
  ComplexityCounts,
  DEFAULT_ESTIMATION_PARAMETERS,
  EstimationInput,
  EstimationParameters,
  EstimationResult,
  FunctionPointData,
  UseCasePointData,
} from "@/types/estimation";

/** IFPUG standard weights per function type and complexity. */
const FP_WEIGHTS = {
  ei: { simple: 3, average: 4, complex: 6 },
  eo: { simple: 4, average: 5, complex: 7 },
  eq: { simple: 3, average: 4, complex: 6 },
  ilf: { simple: 7, average: 10, complex: 15 },
  eif: { simple: 5, average: 7, complex: 10 },
} as const;

/** UCP actor weights (Cockburn / Schneider). */
const ACTOR_WEIGHTS = { simple: 1, average: 2, complex: 3 } as const;

/** UCP use-case weights. */
const USE_CASE_WEIGHTS = { simple: 5, average: 10, complex: 15 } as const;

const HOURS_PER_PERSON_DAY = 8;

function sumComplexityPoints(
  counts: ComplexityCounts,
  weights: { simple: number; average: number; complex: number }
): number {
  return (
    counts.simple * weights.simple +
    counts.average * weights.average +
    counts.complex * weights.complex
  );
}

function sumRatings(ratings: Record<string, number>): number {
  return Object.values(ratings).reduce((sum, v) => sum + clampRating(v), 0);
}

/** Clamp GSC / TCF / ECF ratings to the valid 0–5 range. */
export function clampRating(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(5, Math.max(0, Math.round(value)));
}

/** Unadjusted Function Points (UFP). */
export function calculateUFP(data: FunctionPointData): number {
  return (
    sumComplexityPoints(data.ei, FP_WEIGHTS.ei) +
    sumComplexityPoints(data.eo, FP_WEIGHTS.eo) +
    sumComplexityPoints(data.eq, FP_WEIGHTS.eq) +
    sumComplexityPoints(data.ilf, FP_WEIGHTS.ilf) +
    sumComplexityPoints(data.eif, FP_WEIGHTS.eif)
  );
}

/**
 * Value Adjustment Factor multiplier.
 * VAF = 0.65 + 0.01 × Σ(GSC ratings)
 */
export function calculateVAFMultiplier(vafSum: number): number {
  return 0.65 + 0.01 * vafSum;
}

/** Adjusted Function Points: FP = UFP × VAF multiplier. */
export function calculateAdjustedFP(ufp: number, vafSum: number): number {
  return ufp * calculateVAFMultiplier(vafSum);
}

/** Unadjusted Use Case Points. */
export function calculateUUCP(data: UseCasePointData): {
  actorPoints: number;
  useCasePoints: number;
  uucp: number;
} {
  const actorPoints = sumComplexityPoints(data.actors, ACTOR_WEIGHTS);
  const useCasePoints = sumComplexityPoints(data.useCases, USE_CASE_WEIGHTS);
  return {
    actorPoints,
    useCasePoints,
    uucp: actorPoints + useCasePoints,
  };
}

/**
 * Technical Complexity Factor.
 * TCF = 0.6 + (0.01 × Σ T-factor ratings)
 */
export function calculateTCF(tcfSum: number): number {
  return 0.6 + 0.01 * tcfSum;
}

/**
 * Environmental Complexity Factor.
 * ECF = 1.4 − (0.03 × Σ E-factor ratings)
 */
export function calculateECF(ecfSum: number): number {
  return 1.4 - 0.03 * ecfSum;
}

/** Adjusted Use Case Points: UCP = UUCP × TCF × ECF. */
export function calculateAdjustedUCP(
  uucp: number,
  tcf: number,
  ecf: number
): number {
  return uucp * tcf * ecf;
}

export function calculateEffort(
  adjustedFP: number,
  adjustedUCP: number,
  params: EstimationParameters
): EstimationResult["effort"] {
  const fpHours = adjustedFP * params.hoursPerFP;
  const ucpHours = adjustedUCP * params.hoursPerUCP;
  const blendedHours = (fpHours + ucpHours) / 2;

  return {
    fpHours,
    ucpHours,
    blendedHours,
    fpPersonDays: fpHours / HOURS_PER_PERSON_DAY,
    ucpPersonDays: ucpHours / HOURS_PER_PERSON_DAY,
    blendedPersonDays: blendedHours / HOURS_PER_PERSON_DAY,
  };
}

export function calculateCost(
  effort: EstimationResult["effort"],
  params: EstimationParameters
): EstimationResult["cost"] {
  return {
    fpCost: effort.fpHours * params.hourlyRate,
    ucpCost: effort.ucpHours * params.hourlyRate,
    blendedCost: effort.blendedHours * params.hourlyRate,
  };
}

/** Full estimation pipeline from user input. */
export function runEstimation(
  input: EstimationInput,
  overrides?: Partial<EstimationParameters>
): EstimationResult {
  const parameters: EstimationParameters = {
    ...DEFAULT_ESTIMATION_PARAMETERS,
    ...input.parameters,
    ...overrides,
  };

  const ufp = calculateUFP(input.functionPoints);
  const vafSum = sumRatings(input.vaf);
  const vafMultiplier = calculateVAFMultiplier(vafSum);
  const adjustedFP = calculateAdjustedFP(ufp, vafSum);

  const { actorPoints, useCasePoints, uucp } = calculateUUCP(
    input.useCasePoints
  );
  const tcfSum = sumRatings(input.useCasePoints.tcf);
  const ecfSum = sumRatings(input.useCasePoints.ecf);
  const tcf = calculateTCF(tcfSum);
  const ecf = calculateECF(ecfSum);
  const adjustedUCP = calculateAdjustedUCP(uucp, tcf, ecf);

  const effort = calculateEffort(adjustedFP, adjustedUCP, parameters);
  const cost = calculateCost(effort, parameters);

  return {
    projectName: input.projectName,
    functionPoints: {
      ufp,
      vafSum,
      vafMultiplier,
      adjustedFP,
      byType: {
        ei: sumComplexityPoints(input.functionPoints.ei, FP_WEIGHTS.ei),
        eo: sumComplexityPoints(input.functionPoints.eo, FP_WEIGHTS.eo),
        eq: sumComplexityPoints(input.functionPoints.eq, FP_WEIGHTS.eq),
        ilf: sumComplexityPoints(input.functionPoints.ilf, FP_WEIGHTS.ilf),
        eif: sumComplexityPoints(input.functionPoints.eif, FP_WEIGHTS.eif),
      },
    },
    useCasePoints: {
      actorPoints,
      useCasePoints,
      uucp,
      tcfSum,
      tcf,
      ecfSum,
      ecf,
      adjustedUCP,
    },
    effort,
    cost,
    parameters,
    generatedAt: new Date().toISOString(),
  };
}

export function formatCurrency(
  amount: number,
  symbol: string = "$"
): string {
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatHours(hours: number): string {
  return `${hours.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} h`;
}
