#!/usr/bin/env node
/**
 * compare.mjs — 2つの summary.json を比較し改善/劣化を有意差付きで表示
 *
 * 95% CI が重複しなければ統計的に有意と判定する。
 *
 * Usage:
 *   node bench/compare.mjs before/summary.json after/summary.json
 *
 * 通常は bench/diff.sh 経由で commit hash 指定で使う:
 *   ./bench/diff.sh <commit_a> <commit_b>
 */

import fs from "node:fs";

const [, , beforePath, afterPath] = process.argv;

if (!beforePath || !afterPath) {
  console.error("Usage: node bench/compare.mjs <before.json> <after.json>");
  process.exit(1);
}

const before = JSON.parse(fs.readFileSync(beforePath, "utf8"));
const after = JSON.parse(fs.readFileSync(afterPath, "utf8"));

console.log("=".repeat(90));
console.log("Comparison: Before vs After");
console.log(`  Before: ${beforePath}`);
console.log(`  After:  ${afterPath}`);
console.log("=".repeat(90));

const results = [];

function compareEntry(key, label, beforeStats, afterStats, lowerIsBetter = true) {
  if (!beforeStats?.median || !afterStats?.median) return;

  const bMedian = beforeStats.median;
  const aMedian = afterStats.median;
  const change = aMedian - bMedian;
  const changePct = bMedian !== 0 ? (change / bMedian) * 100 : 0;

  // 95% CI 重複チェック
  const bLo = beforeStats.ci95Lower ?? bMedian;
  const bHi = beforeStats.ci95Upper ?? bMedian;
  const aLo = afterStats.ci95Lower ?? aMedian;
  const aHi = afterStats.ci95Upper ?? aMedian;
  const significant = aLo > bHi || aHi < bLo;

  const improved = lowerIsBetter ? change < 0 : change > 0;
  const regressed = lowerIsBetter ? change > 0 : change < 0;

  let verdict;
  if (!significant) {
    verdict = "  ~  (not significant)";
  } else if (improved) {
    verdict = `  ✓  IMPROVED`;
  } else if (regressed) {
    verdict = `  ✗  REGRESSED`;
  } else {
    verdict = "  =  (no change)";
  }

  results.push({
    key,
    label,
    bMedian,
    aMedian,
    changePct,
    significant,
    improved: improved && significant,
    regressed: regressed && significant,
    verdict,
  });
}

// Lighthouse summary format: { page: { Metric: stats } }
// API summary format: { endpoint: { "Avg Latency": stats } }
// DB summary format: { query: stats }
for (const [key, bVal] of Object.entries(before)) {
  const aVal = after[key];
  if (!aVal) continue;

  if (bVal.median !== undefined) {
    // DB format: flat stats
    const lowerIsBetter = !key.includes("rps") && !key.includes("RPS") && !key.includes("Score");
    compareEntry(key, key, bVal, aVal, lowerIsBetter);
  } else {
    // Nested format (lighthouse / api)
    for (const [metric, bStats] of Object.entries(bVal)) {
      const aStats = aVal[metric];
      if (!aStats) continue;

      const lowerIsBetter = !metric.includes("RPS") && !metric.includes("Score") && !metric.includes("Throughput");
      compareEntry(`${key}/${metric}`, `${key} → ${metric}`, bStats, aStats, lowerIsBetter);
    }
  }
}

// 表示
const cols = ["Metric", "Before", "After", "Change", "Verdict"];
const widths = [40, 12, 12, 12, 25];

console.log("");
console.log(cols.map((c, i) => c.padEnd(widths[i])).join(" | "));
console.log(widths.map((w) => "-".repeat(w)).join("-+-"));

for (const r of results) {
  const row = [
    r.label.slice(0, widths[0]).padEnd(widths[0]),
    r.bMedian.toFixed(2).padStart(widths[1]),
    r.aMedian.toFixed(2).padStart(widths[2]),
    `${r.changePct >= 0 ? "+" : ""}${r.changePct.toFixed(1)}%`.padStart(widths[3]),
    r.verdict.padEnd(widths[4]),
  ];
  console.log(row.join(" | "));
}

// サマリー
const improved = results.filter((r) => r.improved).length;
const regressed = results.filter((r) => r.regressed).length;
const unchanged = results.length - improved - regressed;

console.log("");
console.log(`Total: ${results.length} metrics compared`);
console.log(`  ✓ Improved:     ${improved}`);
console.log(`  ✗ Regressed:    ${regressed}`);
console.log(`  ~ Not significant / unchanged: ${unchanged}`);
