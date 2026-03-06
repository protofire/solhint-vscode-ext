export interface SolhintProblem {
  ruleId: string;
  message: string;
  line: number;
  column: number;
  severity: number;
}

export interface SolhintModuleShape {
  linter?: {
    processStr: (
      code: string,
      config?: unknown,
      fileName?: string
    ) => unknown;
  };
  processStr?: (
    code: string,
    config?: unknown,
    fileName?: string
  ) => unknown;
}