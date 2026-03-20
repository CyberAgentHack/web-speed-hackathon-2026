#!/usr/bin/env node
/**
 * aggregate-frontend.mjs — フロントエンド転送量・TTFBの統計集約
 *
 * Usage: node bench/aggregate-frontend.mjs ./bench-results/frontend/YYYYMMDD_HHMMSS
 */

import fs from "node:fs";
import path from "node:path";
import { computeStats, printStatsTable } from "./stats.mjs";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node bench/aggregate-frontend.mjs <result-dir>");
  process.exit(1);
}

const summary = {};

// Transfer & TTFB
const transferPath = path.join(dir, "transfer.json");
if (fs.existsSync(transferPath)) {
  const transfer = JSON.parse(fs.readFileSync(transferPath, "utf8"));

  console.log("=".repeat(60));
  console.log("Page Transfer & TTFB");
  console.log("=".repeat(60));

  for (const [page, data] of Object.entries(transfer)) {
    const bytesStats = computeStats(data.transfer_bytes);
    const ttfbStats = computeStats(data.ttfb_ms);

    summary[`${page}_transfer_bytes`] = bytesStats;
    summary[`${page}_ttfb_ms`] = ttfbStats;

    printStatsTable(`${page} - Transfer Size`, bytesStats, "bytes");
    printStatsTable(`${page} - TTFB`, ttfbStats, "ms");
  }
}

// Bundle Stats (from rollup-plugin-bundle-stats / bundle-stats-webpack-plugin)
const bundleStatsPath = path.join(dir, "bundle-stats.json");
if (fs.existsSync(bundleStatsPath)) {
  const data = JSON.parse(fs.readFileSync(bundleStatsPath, "utf8"));

  console.log(`\n${"=".repeat(60)}`);
  console.log("Bundle Stats Summary");
  console.log("=".repeat(60));

  // Summary metrics
  for (const item of (data.summary?.webpack || [])) {
    console.log(`  ${item.label}: ${item.displayValue}`);
    summary[`bundleStats_${item.label.replace(/\s+/g, "_")}`] = {
      value: item.value,
      displayValue: item.displayValue,
    };
  }

  // Size by type
  console.log("");
  console.log("  Size by type:");
  for (const s of (data.sizes || [])) {
    const val = s.runs?.[0]?.value || 0;
    const display = s.runs?.[0]?.displayValue || "0B";
    if (val > 0) {
      console.log(`    ${s.label}: ${display}`);
      summary[`bundleStats_size_${s.label}`] = { value: val, displayValue: display };
    }
  }

  // Top assets
  const assets = (data.assets || [])
    .map(a => ({ name: a.runs?.[0]?.name || a.label, size: a.runs?.[0]?.value || 0, initial: a.runs?.[0]?.isInitial }))
    .sort((a, b) => b.size - a.size);

  console.log("");
  console.log("  Top 10 assets:");
  for (const a of assets.slice(0, 10)) {
    const kb = (a.size / 1024).toFixed(1);
    const tag = a.initial ? " [initial]" : "";
    console.log(`    ${kb.padStart(10)} KB  ${a.name}${tag}`);
  }

  summary["bundleStats_assets_count"] = { value: assets.length };
  summary["bundleStats_total_js"] = data.sizes?.find(s => s.label === "JS")?.runs?.[0] || {};
  summary["bundleStats_total_css"] = data.sizes?.find(s => s.label === "CSS")?.runs?.[0] || {};
  summary["bundleStats_modules_count"] = { value: data.modules?.length || 0 };
  summary["bundleStats_packages_count"] = { value: data.packages?.length || 0 };
}

// JSON保存
const summaryPath = path.join(dir, "summary.json");
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(`\nSummary saved to: ${summaryPath}`);
