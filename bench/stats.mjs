/**
 * 統計ユーティリティ（外部依存なし）
 *
 * mean, median, stddev, p5, p95, 95% CI (t分布), min, max, CV を計算
 */

// t分布の臨界値（両側 95%）— サンプルサイズ 2〜30 + ∞
const T_TABLE = {
  1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
  6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
  11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
  16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
  25: 2.060, 30: 2.042, 40: 2.021, 60: 2.000, 120: 1.980,
};

function tCritical(df) {
  if (T_TABLE[df]) return T_TABLE[df];
  const keys = Object.keys(T_TABLE).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < keys.length - 1; i++) {
    if (df > keys[i] && df < keys[i + 1]) {
      const lo = keys[i], hi = keys[i + 1];
      const frac = (df - lo) / (hi - lo);
      return T_TABLE[lo] + frac * (T_TABLE[hi] - T_TABLE[lo]);
    }
  }
  return 1.96; // z for large n
}

export function computeStats(values) {
  const filtered = values.filter((v) => v != null && Number.isFinite(v));
  const sorted = [...filtered].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return null;

  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1 || 1);
  const stddev = Math.sqrt(variance);

  const cv = mean !== 0 ? (stddev / Math.abs(mean)) * 100 : 0;

  const p5 = sorted[Math.max(0, Math.ceil(n * 0.05) - 1)];
  const p95 = sorted[Math.min(n - 1, Math.ceil(n * 0.95) - 1)];

  const se = stddev / Math.sqrt(n);
  const t = tCritical(n - 1);
  const ci95Lower = mean - t * se;
  const ci95Upper = mean + t * se;

  return {
    n,
    mean,
    median,
    stddev,
    cv,
    p5,
    p95,
    min: sorted[0],
    max: sorted[n - 1],
    ci95Lower,
    ci95Upper,
  };
}

export function formatStats(stats, unit = "") {
  if (!stats) return "no data";
  const u = unit ? ` ${unit}` : "";
  return [
    `n=${stats.n}`,
    `mean=${stats.mean.toFixed(2)}${u}`,
    `median=${stats.median.toFixed(2)}${u}`,
    `stddev=${stats.stddev.toFixed(2)}`,
    `CV=${stats.cv.toFixed(1)}%`,
    `95%CI=[${stats.ci95Lower.toFixed(2)}, ${stats.ci95Upper.toFixed(2)}]${u}`,
    `p5=${stats.p5.toFixed(2)}${u}`,
    `p95=${stats.p95.toFixed(2)}${u}`,
    `min=${stats.min.toFixed(2)}${u}`,
    `max=${stats.max.toFixed(2)}${u}`,
  ].join("  ");
}

export function printStatsTable(label, stats, unit = "") {
  console.log(`\n── ${label} ──`);
  if (!stats) {
    console.log("  (no data)");
    return;
  }
  const u = unit ? ` ${unit}` : "";
  const rows = [
    ["n", String(stats.n)],
    ["mean", `${stats.mean.toFixed(2)}${u}`],
    ["median", `${stats.median.toFixed(2)}${u}`],
    ["stddev", stats.stddev.toFixed(2)],
    ["CV", `${stats.cv.toFixed(1)}%`],
    ["95% CI", `[${stats.ci95Lower.toFixed(2)}, ${stats.ci95Upper.toFixed(2)}]${u}`],
    ["p5", `${stats.p5.toFixed(2)}${u}`],
    ["p95", `${stats.p95.toFixed(2)}${u}`],
    ["min", `${stats.min.toFixed(2)}${u}`],
    ["max", `${stats.max.toFixed(2)}${u}`],
  ];
  const maxKey = Math.max(...rows.map(([k]) => k.length));
  for (const [k, v] of rows) {
    console.log(`  ${k.padEnd(maxKey)}  ${v}`);
  }
}
