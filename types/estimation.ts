/** Simple / Average / Complex counts for FP function types (IFPUG). */
export interface ComplexityCounts {
  simple: number;
  average: number;
  complex: number;
}

/** External Inputs, Outputs, Inquiries, Internal Logical Files, External Interface Files. */
export interface FunctionPointData {
  ei: ComplexityCounts;
  eo: ComplexityCounts;
  eq: ComplexityCounts;
  ilf: ComplexityCounts;
  eif: ComplexityCounts;
}

/** 14 Value Adjustment Factors (GSC), each rated 0–5. */
export type VAFFactorId =
  | "dataCommunications"
  | "distributedDataProcessing"
  | "performance"
  | "heavilyUsedConfiguration"
  | "transactionRate"
  | "onlineDataEntry"
  | "endUserEfficiency"
  | "onlineUpdate"
  | "complexProcessing"
  | "reusability"
  | "installationEase"
  | "operationalEase"
  | "multipleSites"
  | "facilitateChange";

export type VAFRatings = Record<VAFFactorId, number>;

/** UCP actor complexity counts. */
export interface ActorCounts {
  simple: number;
  average: number;
  complex: number;
}

/** UCP use-case complexity counts. */
export interface UseCaseCounts {
  simple: number;
  average: number;
  complex: number;
}

/** 13 Technical Complexity Factors, each rated 0–5. */
export type TCFFactorId =
  | "distributedSystem"
  | "responseTimePerformance"
  | "endUserEfficiency"
  | "internalProcessingComplexity"
  | "codeReusability"
  | "installationEase"
  | "operationalEase"
  | "portability"
  | "changeover"
  | "concurrency"
  | "securityFeatures"
  | "endUserTraining"
  | "personnelTurnover";

export type TCFRatings = Record<TCFFactorId, number>;

/** 8 Environmental Complexity Factors, each rated 0–5. */
export type ECFFactorId =
  | "familiarityWithProcess"
  | "applicationExperience"
  | "oopExperience"
  | "leadAnalystCapability"
  | "motivation"
  | "stableRequirements"
  | "partTimeStaff"
  | "difficultLanguage";

export type ECFRatings = Record<ECFFactorId, number>;

export interface UseCasePointData {
  actors: ActorCounts;
  useCases: UseCaseCounts;
  tcf: TCFRatings;
  ecf: ECFRatings;
}

/** Adjustable productivity and cost parameters. */
export interface EstimationParameters {
  /** Hours per Function Point (default 20). */
  hoursPerFP: number;
  /** Hours per Use Case Point (default 20). */
  hoursPerUCP: number;
  /** Team hourly rate in currency units (default 50). */
  hourlyRate: number;
  /** Currency symbol for display (default "$"). */
  currencySymbol: string;
}

export interface EstimationInput {
  projectName: string;
  functionPoints: FunctionPointData;
  vaf: VAFRatings;
  useCasePoints: UseCasePointData;
  parameters: EstimationParameters;
}

/** Intermediate FP breakdown. */
export interface FunctionPointBreakdown {
  ufp: number;
  vafSum: number;
  vafMultiplier: number;
  adjustedFP: number;
  byType: {
    ei: number;
    eo: number;
    eq: number;
    ilf: number;
    eif: number;
  };
}

/** Intermediate UCP breakdown. */
export interface UseCasePointBreakdown {
  actorPoints: number;
  useCasePoints: number;
  uucp: number;
  tcfSum: number;
  tcf: number;
  ecfSum: number;
  ecf: number;
  adjustedUCP: number;
}

export interface EffortEstimate {
  fpHours: number;
  ucpHours: number;
  /** Average of FP-based and UCP-based effort. */
  blendedHours: number;
  fpPersonDays: number;
  ucpPersonDays: number;
  blendedPersonDays: number;
}

export interface CostEstimate {
  fpCost: number;
  ucpCost: number;
  blendedCost: number;
}

/** Final computed estimation output. */
export interface EstimationResult {
  projectName: string;
  functionPoints: FunctionPointBreakdown;
  useCasePoints: UseCasePointBreakdown;
  effort: EffortEstimate;
  cost: CostEstimate;
  parameters: EstimationParameters;
  generatedAt: string;
}

export interface FactorDefinition {
  id: string;
  label: string;
  description: string;
}

export const VAF_FACTOR_DEFINITIONS: FactorDefinition[] = [
  { id: "dataCommunications", label: "Data Communications", description: "How many communication facilities support data transfer?" },
  { id: "distributedDataProcessing", label: "Distributed Data Processing", description: "Distributed data or processing functions?" },
  { id: "performance", label: "Performance", description: "Response time or throughput constraints?" },
  { id: "heavilyUsedConfiguration", label: "Heavily Used Configuration", description: "Current operational platform heavily used?" },
  { id: "transactionRate", label: "Transaction Rate", description: "High transaction rate expected?" },
  { id: "onlineDataEntry", label: "Online Data Entry", description: "Significant online data entry?" },
  { id: "endUserEfficiency", label: "End-User Efficiency", description: "Designed for end-user efficiency?" },
  { id: "onlineUpdate", label: "Online Update", description: "Online update of internal logical files?" },
  { id: "complexProcessing", label: "Complex Processing", description: "Complex internal processing?" },
  { id: "reusability", label: "Reusability", description: "Code designed for reuse?" },
  { id: "installationEase", label: "Installation Ease", description: "Conversion and installation ease?" },
  { id: "operationalEase", label: "Operational Ease", description: "Operational ease (backup, recovery)?" },
  { id: "multipleSites", label: "Multiple Sites", description: "Application installed at multiple sites?" },
  { id: "facilitateChange", label: "Facilitate Change", description: "Designed to facilitate change?" },
];

export const TCF_FACTOR_DEFINITIONS: FactorDefinition[] = [
  { id: "distributedSystem", label: "Distributed System", description: "System distributed across multiple servers?" },
  { id: "responseTimePerformance", label: "Response Time / Performance", description: "Performance objectives critical?" },
  { id: "endUserEfficiency", label: "End-User Efficiency", description: "GUI and usability requirements?" },
  { id: "internalProcessingComplexity", label: "Internal Processing Complexity", description: "Complex business logic?" },
  { id: "codeReusability", label: "Code Reusability", description: "Reusable components required?" },
  { id: "installationEase", label: "Installation Ease", description: "Ease of installation and deployment?" },
  { id: "operationalEase", label: "Operational Ease", description: "Ease of operation and monitoring?" },
  { id: "portability", label: "Portability", description: "Portability across platforms?" },
  { id: "changeover", label: "Changeover", description: "Conversion from existing system?" },
  { id: "concurrency", label: "Concurrency", description: "Concurrent users and transactions?" },
  { id: "securityFeatures", label: "Security Features", description: "Security and access control?" },
  { id: "endUserTraining", label: "End-User Training", description: "End-user training required?" },
  { id: "personnelTurnover", label: "Personnel Turnover", description: "Staff turnover risk?" },
];

export const ECF_FACTOR_DEFINITIONS: FactorDefinition[] = [
  { id: "familiarityWithProcess", label: "Familiarity with Process", description: "Team familiarity with the business process?" },
  { id: "applicationExperience", label: "Application Experience", description: "Experience with similar applications?" },
  { id: "oopExperience", label: "OOP Experience", description: "Object-oriented experience?" },
  { id: "leadAnalystCapability", label: "Lead Analyst Capability", description: "Lead analyst capability?" },
  { id: "motivation", label: "Motivation", description: "Team motivation level?" },
  { id: "stableRequirements", label: "Stable Requirements", description: "Requirements stability?" },
  { id: "partTimeStaff", label: "Part-Time Staff", description: "Part-time staff on the team?" },
  { id: "difficultLanguage", label: "Difficult Language", description: "Difficulty of programming language?" },
];

export const DEFAULT_ESTIMATION_PARAMETERS: EstimationParameters = {
  hoursPerFP: 20,
  hoursPerUCP: 20,
  hourlyRate: 50,
  currencySymbol: "$",
};

export function createEmptyComplexityCounts(): ComplexityCounts {
  return { simple: 0, average: 0, complex: 0 };
}

export function createEmptyFunctionPointData(): FunctionPointData {
  return {
    ei: createEmptyComplexityCounts(),
    eo: createEmptyComplexityCounts(),
    eq: createEmptyComplexityCounts(),
    ilf: createEmptyComplexityCounts(),
    eif: createEmptyComplexityCounts(),
  };
}

export function createDefaultVAFRatings(): VAFRatings {
  return Object.fromEntries(
    VAF_FACTOR_DEFINITIONS.map((f) => [f.id, 3])
  ) as VAFRatings;
}

export function createDefaultTCFRatings(): TCFRatings {
  return Object.fromEntries(
    TCF_FACTOR_DEFINITIONS.map((f) => [f.id, 3])
  ) as TCFRatings;
}

export function createDefaultECFRatings(): ECFRatings {
  return Object.fromEntries(
    ECF_FACTOR_DEFINITIONS.map((f) => [f.id, 3])
  ) as ECFRatings;
}

export function createEmptyEstimationInput(): EstimationInput {
  return {
    projectName: "",
    functionPoints: createEmptyFunctionPointData(),
    vaf: createDefaultVAFRatings(),
    useCasePoints: {
      actors: { simple: 0, average: 0, complex: 0 },
      useCases: { simple: 0, average: 0, complex: 0 },
      tcf: createDefaultTCFRatings(),
      ecf: createDefaultECFRatings(),
    },
    parameters: { ...DEFAULT_ESTIMATION_PARAMETERS },
  };
}
