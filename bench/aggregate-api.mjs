#!/usr/bin/env node
/**
 * aggregate-api.mjs — autocannon JSON 結果をラウンド分集約し統計量を出力
 *
 * autocannon の各 round は内部で p50/p95/p99 を持つ。
 * ここでは round 間の avg latency / rps のばらつきを統計評価する。
 *
 * Usage: node bench/aggregate-api.mjs ./bench-results/api/YYYYMMDD_HHMMSS
 */

import fs from "node:fs";
import path from "node:path";
import { computeStats, printStatsTable } from "./stats.mjs";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node bench/aggregate-api.mjs <result-dir>");
  process.exit(1);
}

const summary = {};

const endpoints = fs.readdirSync(dir).filter((f) => {
  const p = path.join(dir, f);
  return fs.statSync(p).isDirectory();
});

for (const ep of endpoints) {
  const epDir = path.join(dir, ep);
  const rounds = fs.readdirSync(epDir).filter((f) => f.endsWith(".json") && f.startsWith("round_"));

  if (rounds.length === 0) continue;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Endpoint: ${ep} (${rounds.length} rounds)`);
  console.log("=".repeat(60));

  const collected = {
    avgLatency: [],
    p50Latency: [],
    p95Latency: [],
    p99Latency: [],
    maxLatency: [],
    avgRps: [],
    totalRequests: [],
    errors: [],
    timeouts: [],
    throughputMBps: [],
  };

  for (const round of rounds) {
    const data = JSON.parse(fs.readFileSync(path.join(epDir, round), "utf8"));
    const lat = data.latency;
    const req = data.requests;

    collected.avgLatency.push(lat.average);
    collected.p50Latency.push(lat.p50);
    collected.p95Latency.push(lat.p95);
    collected.p99Latency.push(lat.p99);
    collected.maxLatency.push(lat.max);
    collected.avgRps.push(req.average);
    collected.totalRequests.push(req.total);
    collected.errors.push(data.errors ?? 0);
    collected.timeouts.push(data.timeouts ?? 0);
    collected.throughputMBps.push((data.throughput?.average ?? 0) / 1024 / 1024);
  }

  const epStats = {};
  const metrics = [
    { key: "avgLatency",    label: "Avg Latency",   unit: "ms" },
    { key: "p50Latency",    label: "p50 Latency",   unit: "ms" },
    { key: "p95Latency",    label: "p95 Latency",   unit: "ms" },
    { key: "p99Latency",    label: "p99 Latency",   unit: "ms" },
    { key: "maxLatency",    label: "Max Latency",   unit: "ms" },
    { key: "avgRps",        label: "Avg RPS",       unit: "req/s" },
    { key: "throughputMBps", label: "Throughput",    unit: "MB/s" },
  ];

  for (const m of metrics) {
    const stats = computeStats(collected[m.key]);
    epStats[m.label] = stats;
    printStatsTable(m.label, stats, m.unit);
  }

  const totalErrors = collected.errors.reduce((a, b) => a + b, 0);
  const totalTimeouts = collected.timeouts.reduce((a, b) => a + b, 0);
  if (totalErrors > 0 || totalTimeouts > 0) {
    console.log(`\n  ⚠ errors=${totalErrors}  timeouts=${totalTimeouts}`);
  }

  summary[ep] = epStats;
}

// サマリー表
console.log(`\n${"=".repeat(100)}`);
console.log("SUMMARY (median values)");
console.log("=".repeat(100));

const cols = ["Endpoint", "Avg Lat (ms)", "p50 (ms)", "p95 (ms)", "p99 (ms)", "RPS", "MB/s"];
const widths = [25, 12, 10, 10, 10, 10, 10];

console.log(cols.map((c, i) => c.padEnd(widths[i])).join(" | "));
console.log(widths.map((w) => "-".repeat(w)).join("-+-"));

for (const [ep, stats] of Object.entries(summary)) {
  const row = [
    ep.padEnd(widths[0]),
    (stats["Avg Latency"]?.median?.toFixed(1) ?? "N/A").padStart(widths[1]),
    (stats["p50 Latency"]?.median?.toFixed(1) ?? "N/A").padStart(widths[2]),
    (stats["p95 Latency"]?.median?.toFixed(1) ?? "N/A").padStart(widths[3]),
    (stats["p99 Latency"]?.median?.toFixed(1) ?? "N/A").padStart(widths[4]),
    (stats["Avg RPS"]?.median?.toFixed(0) ?? "N/A").padStart(widths[5]),
    (stats["Throughput"]?.median?.toFixed(2) ?? "N/A").padStart(widths[6]),
  ];
  console.log(row.join(" | "));
}

// ボトルネック特定
console.log("\n── Bottleneck Ranking (by median p95 latency) ──");
const ranked = Object.entries(summary)
  .map(([ep, stats]) => ({
    ep,
    p95: stats["p95 Latency"]?.median ?? 0,
    rps: stats["Avg RPS"]?.median ?? 0,
  }))
  .sort((a, b) => b.p95 - a.p95);

for (let i = 0; i < ranked.length; i++) {
  const r = ranked[i];
  console.log(`  ${i + 1}. ${r.ep}: p95=${r.p95.toFixed(1)}ms  rps=${r.rps.toFixed(0)}`);
}

// JSON保存
const summaryPath = path.join(dir, "summary.json");
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(`\nSummary saved to: ${summaryPath}`);
