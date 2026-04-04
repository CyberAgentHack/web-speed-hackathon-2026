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
      ["total-blocking-time"]: audits["total-blocking-time"]?.score,
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

  // LCP が 0 のときだけ、何が LCP 候補として評価されているかを確認する
  const lcpAudit = audits["largest-contentful-paint"] as
    | (Result["audits"]["largest-contentful-paint"] & {
        numericValue?: number;
        displayValue?: string;
        details?: unknown;
      })
    | undefined;
  if (lcpAudit != null && (lcpAudit.score === 0 || lcpAudit.score == null)) {
    consola.info("[debug] largest-contentful-paint:", {
      score: lcpAudit.score,
      numericValue: (lcpAudit as any).numericValue,
      displayValue: (lcpAudit as any).displayValue,
      details: (lcpAudit as any).details,
    });
  }
  const lcpElementAudit = audits["largest-contentful-paint-element"] as
    | (Result["audits"]["largest-contentful-paint-element"] & { details?: unknown })
    | undefined;
  if (lcpElementAudit != null) {
    const details = (lcpElementAudit as any).details as
      | { items?: unknown[] }
      | unknown;
    const itemsPreview = Array.isArray((details as any)?.items)
      ? (details as any).items.slice(0, 5)
      : null;
    consola.info("[debug] largest-contentful-paint-element:", {
      score: lcpElementAudit.score,
      value: (lcpElementAudit as any).numericValue ?? (lcpElementAudit as any).displayValue,
      details: itemsPreview
        ? itemsPreview.map((item) => ({
            // shape が固定でないので、存在するキーだけ抜きます
            selector: (item as any).selector,
            type: (item as any).type,
            text: (item as any).text,
            snippet: (item as any).snippet,
            // それでも分からない場合のため、短くJSONで落とします
            raw: JSON.stringify(item).slice(0, 1200),
          }))
        : details,
    });
  }

  // TBT が 0 のときだけ詳細を出して、Long Task 等が実際に
  // どれだけ発生しているかを確認する
  const tbtAudit = audits["total-blocking-time"] as
    | (Result["audits"]["total-blocking-time"] & {
        numericValue?: number;
        displayValue?: string;
        details?: unknown;
      })
    | undefined;
  const tbtNumericValue = (tbtAudit as any)?.numericValue as number | undefined;
  if (
    tbtAudit != null &&
    ((tbtAudit.score === 0 || tbtAudit.score == null || tbtAudit.score <= 0.2) ||
      (tbtNumericValue != null && tbtNumericValue > 5000))
  ) {
    consola.info("[debug] total-blocking-time:", {
      score: tbtAudit.score,
      numericValue: tbtNumericValue,
      displayValue: (tbtAudit as any).displayValue,
    });

    // long-tasks / mainthread-work-breakdown は別 audit として取る
    const longTasksAudit = audits["long-tasks"] as any;
    const mainThreadBreakdownAudit = audits["mainthread-work-breakdown"] as any;

    // details の形が固まってないことがあるので、ここは短く要約して出す
    const longTasksDetails = longTasksAudit?.details;
    let longTasksSummary: unknown = null;
    if (Array.isArray(longTasksDetails?.items)) {
      longTasksSummary = longTasksDetails.items.slice(0, 5).map((it: any) => ({
        durationMs: it?.duration,
        at: it?.attribution?.[0]?.url ?? it?.attribution?.[0]?.script ?? null,
      }));
    } else if (Array.isArray(longTasksDetails?.longTasks)) {
      longTasksSummary = longTasksDetails.longTasks.slice(0, 5);
    }

    const mainThreadBreakdownDetails = mainThreadBreakdownAudit?.details;
    const mainThreadSummary = mainThreadBreakdownDetails
      ? Object.fromEntries(
          Object.entries(mainThreadBreakdownDetails)
            .filter(([k]) => ["mainThreadTasks", "items", "total"].includes(k) === false)
            .slice(0, 5),
        )
      : null;

    consola.info("[debug] long-tasks / mainthread-work-breakdown:", {
      longTasksScore: longTasksAudit?.score,
      longTasksSummary,
      mainThreadBreakdownScore: mainThreadBreakdownAudit?.score,
      mainThreadBreakdownDetailsPreview: mainThreadSummary,
      longTasksDetailsRawPreview: JSON.stringify(longTasksDetails)?.slice(0, 1200) ?? null,
      mainThreadBreakdownDetailsRawPreview: JSON.stringify(mainThreadBreakdownDetails)?.slice(0, 1200) ?? null,
    });
  }
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
