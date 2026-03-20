#!/usr/bin/env node
/**
 * aggregate-db.mjs — SQLite ベンチマーク結果を集約し統計量を出力
 *
 * Usage: node bench/aggregate-db.mjs ./bench-results/db/YYYYMMDD_HHMMSS
 */

import fs from "node:fs";
import path from "node:path";
import { computeStats, printStatsTable } from "./stats.mjs";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node bench/aggregate-db.mjs <result-dir>");
  process.exit(1);
}

const rawPath = path.join(dir, "raw.json");
if (!fs.existsSync(rawPath)) {
  console.error(`ERROR: ${rawPath} not found`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(rawPath, "utf8"));
const summary = {};

console.log("=".repeat(60));
console.log("DB Query Benchmark Results");
console.log("=".repeat(60));

for (const [query, times] of Object.entries(raw)) {
  const stats = computeStats(times);
  summary[query] = stats;
  printStatsTable(query, stats, "ms");
}

// ボトルネックランキング
console.log(`\n${"=".repeat(60)}`);
console.log("Bottleneck Ranking (by median execution time)");
console.log("=".repeat(60));

const ranked = Object.entries(summary)
  .filter(([, s]) => s != null)
  .map(([query, stats]) => ({ query, median: stats.median, p95: stats.p95 }))
  .sort((a, b) => b.median - a.median);

for (let i = 0; i < ranked.length; i++) {
  const r = ranked[i];
  console.log(`  ${i + 1}. ${r.query}: median=${r.median.toFixed(3)}ms  p95=${r.p95.toFixed(3)}ms`);
}

// サマリー表
console.log(`\n${"=".repeat(80)}`);
console.log("SUMMARY");
console.log("=".repeat(80));

const cols = ["Query", "Median (ms)", "p95 (ms)", "CV%", "95% CI"];
const widths = [25, 12, 10, 8, 25];

console.log(cols.map((c, i) => c.padEnd(widths[i])).join(" | "));
console.log(widths.map((w) => "-".repeat(w)).join("-+-"));

for (const [query, stats] of Object.entries(summary)) {
  if (!stats) continue;
  const row = [
    query.slice(0, widths[0]).padEnd(widths[0]),
    stats.median.toFixed(3).padStart(widths[1]),
    stats.p95.toFixed(3).padStart(widths[2]),
    stats.cv.toFixed(1).padStart(widths[3]),
    `[${stats.ci95Lower.toFixed(3)}, ${stats.ci95Upper.toFixed(3)}]`.padStart(widths[4]),
  ];
  console.log(row.join(" | "));
}

// JSON保存
const summaryPath = path.join(dir, "summary.json");
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(`\nSummary saved to: ${summaryPath}`);
