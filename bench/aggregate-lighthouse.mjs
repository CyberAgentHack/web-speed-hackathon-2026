#!/usr/bin/env node
/**
 * aggregate-lighthouse.mjs — Lighthouse JSON 結果を集約し統計量を出力
 *
 * Usage: node bench/aggregate-lighthouse.mjs ./bench-results/lighthouse/YYYYMMDD_HHMMSS
 */

import fs from "node:fs";
import path from "node:path";
import { computeStats, printStatsTable } from "./stats.mjs";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node bench/aggregate-lighthouse.mjs <result-dir>");
  process.exit(1);
}

const METRICS = [
  { key: "first-contentful-paint",    label: "FCP",   unit: "ms", weight: 10 },
  { key: "speed-index",              label: "SI",    unit: "ms", weight: 10 },
  { key: "largest-contentful-paint", label: "LCP",   unit: "ms", weight: 25 },
  { key: "total-blocking-time",     label: "TBT",   unit: "ms", weight: 30 },
  { key: "cumulative-layout-shift", label: "CLS",   unit: "",   weight: 25 },
];

const summary = {};

const pages = fs.readdirSync(dir).filter((f) => {
  const p = path.join(dir, f);
  return fs.statSync(p).isDirectory();
});

for (const page of pages) {
  const pageDir = path.join(dir, page);
  const runs = fs.readdirSync(pageDir).filter((f) => f.endsWith(".json") && f.startsWith("run_"));

  if (runs.length === 0) continue;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Page: ${page} (${runs.length} runs)`);
  console.log("=".repeat(60));

  const collected = {};
  for (const m of METRICS) collected[m.key] = [];
  collected["score"] = [];

  for (const run of runs) {
    const data = JSON.parse(fs.readFileSync(path.join(pageDir, run), "utf8"));
    const audits = data.audits;

    for (const m of METRICS) {
      const val = audits[m.key]?.numericValue;
      if (val != null) collected[m.key].push(val);
    }

    const score = data.categories?.performance?.score;
    if (score != null) collected["score"].push(score * 100);
  }

  const pageStats = {};

  for (const m of METRICS) {
    const stats = computeStats(collected[m.key]);
    pageStats[m.label] = stats;
    printStatsTable(`${m.label} (${m.unit || "ratio"})`, stats, m.unit);
  }

  const scoreStats = computeStats(collected["score"]);
  pageStats["Score"] = scoreStats;
  printStatsTable("Performance Score", scoreStats, "pts");

  summary[page] = pageStats;
}

// サマリー表
console.log(`\n${"=".repeat(80)}`);
console.log("SUMMARY (median values)");
console.log("=".repeat(80));

const header = ["Page", ...METRICS.map((m) => m.label), "Score"];
const colWidths = header.map((h) => Math.max(h.length, 12));
colWidths[0] = Math.max(colWidths[0], ...Object.keys(summary).map((k) => k.length));

console.log(header.map((h, i) => h.padEnd(colWidths[i])).join(" | "));
console.log(colWidths.map((w) => "-".repeat(w)).join("-+-"));

for (const [page, stats] of Object.entries(summary)) {
  const row = [
    page.padEnd(colWidths[0]),
    ...METRICS.map((m, i) => {
      const s = stats[m.label];
      return s ? `${s.median.toFixed(1)}`.padStart(colWidths[i + 1]) : "N/A".padStart(colWidths[i + 1]);
    }),
    (() => {
      const s = stats["Score"];
      return s ? `${s.median.toFixed(1)}`.padStart(colWidths[header.length - 1]) : "N/A";
    })(),
  ];
  console.log(row.join(" | "));
}

// 加重スコア合計（ハッカソン採点方式）
console.log("");
const totalScores = Object.values(summary).map((s) => s["Score"]?.median ?? 0);
const totalMedian = totalScores.reduce((a, b) => a + b, 0);
console.log(`Total score (sum of medians): ${totalMedian.toFixed(1)} / 900`);

// JSON保存
const summaryPath = path.join(dir, "summary.json");
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(`\nSummary saved to: ${summaryPath}`);
