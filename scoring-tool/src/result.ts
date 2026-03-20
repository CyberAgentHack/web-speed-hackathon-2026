export type MetricKey = "cls" | "fcp" | "lcp" | "si" | "inp" | "tbt";
export type TargetCategory = "standard" | "userFlow";

export interface MetricScoreBreakdown {
  earnedX100: number;
  key: MetricKey;
  label: string;
  maxX100: number;
}

export interface Result {
  breakdown: MetricScoreBreakdown[];
  error?: Error;
  scoreX100: number;
  target: { category: TargetCategory; maxScore: number; name: string };
}
