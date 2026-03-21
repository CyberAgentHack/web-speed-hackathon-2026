import type { Result } from "lighthouse";

import { consola } from "../../consola";
import type { MetricScoreBreakdown } from "../../result";

type Options = {
  isUserflow: boolean;
};

function _toEarnedX100(score: number | null | undefined, weight: number): number {
  return (score ?? 0) * 100 * weight;
}

function _sumScoreX100(breakdown: MetricScoreBreakdown[]): number {
  return breakdown.reduce((total, metric) => total + metric.earnedX100, 0);
}

export function calculateHackathonScore(
  audits: Result["audits"],
  { isUserflow }: Options,
): { breakdown: MetricScoreBreakdown[]; scoreX100: number } {
  // Each metric is within [0, 1] and with up to two fractional digits.
  // https://github.com/GoogleChrome/lighthouse/blob/516d32c7f66a0ffcfe7fbfc8bb40849699f769dc/core/audits/audit.js#L83-L110
  //
  // Calculate a score using the same weights as Lighthouse 10 without rounding to get more precised performance score.
  // https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/#lighthouse-10
  //
  // To avoid hiccups related to floating-point arithmetic, all metrics are firstly scaled up by 100.

  if (isUserflow) {
    consola.debug({
      ["interaction-to-next-paint"]: audits["interaction-to-next-paint"]?.score,
      ["interaction-to-next-paint-ms"]: audits["interaction-to-next-paint"]?.numericValue,
      ["total-blocking-time"]: audits["total-blocking-time"]?.score,
      ["total-blocking-time-ms"]: audits["total-blocking-time"]?.numericValue,
    });
    const breakdown: MetricScoreBreakdown[] = [
      {
        earnedX100: _toEarnedX100(audits["interaction-to-next-paint"]?.score, 25),
        key: "inp",
        label: "INP",
        maxX100: 25 * 100,
      },
      {
        earnedX100: _toEarnedX100(audits["total-blocking-time"]?.score, 25),
        key: "tbt",
        label: "TBT",
        maxX100: 25 * 100,
      },
    ];
    return {
      breakdown,
      scoreX100: _sumScoreX100(breakdown),
    };
  }

  consola.debug({
    ["cumulative-layout-shift"]: audits["cumulative-layout-shift"]?.score,
    ["first-contentful-paint"]: audits["first-contentful-paint"]?.score,
    ["largest-contentful-paint"]: audits["largest-contentful-paint"]?.score,
    ["speed-index"]: audits["speed-index"]?.score,
    ["total-blocking-time"]: audits["total-blocking-time"]?.score,
  });
  const breakdown: MetricScoreBreakdown[] = [
    {
      earnedX100: _toEarnedX100(audits["cumulative-layout-shift"]?.score, 25),
      key: "cls",
      label: "CLS",
      maxX100: 25 * 100,
    },
    {
      earnedX100: _toEarnedX100(audits["first-contentful-paint"]?.score, 10),
      key: "fcp",
      label: "FCP",
      maxX100: 10 * 100,
    },
    {
      earnedX100: _toEarnedX100(audits["largest-contentful-paint"]?.score, 25),
      key: "lcp",
      label: "LCP",
      maxX100: 25 * 100,
    },
    {
      earnedX100: _toEarnedX100(audits["speed-index"]?.score, 10),
      key: "si",
      label: "SI",
      maxX100: 10 * 100,
    },
    {
      earnedX100: _toEarnedX100(audits["total-blocking-time"]?.score, 30),
      key: "tbt",
      label: "TBT",
      maxX100: 30 * 100,
    },
  ];
  return {
    breakdown,
    scoreX100: _sumScoreX100(breakdown),
  };
}
