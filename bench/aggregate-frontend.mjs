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

// Resource sizes
const resourcesPath = path.join(dir, "resources.json");
if (fs.existsSync(resourcesPath)) {
  const resources = JSON.parse(fs.readFileSync(resourcesPath, "utf8"));

  console.log(`\n${"=".repeat(60)}`);
  console.log("Resource Transfer Sizes");
  console.log("=".repeat(60));

  for (const [name, sizes] of Object.entries(resources)) {
    const stats = computeStats(sizes);
    summary[`resource_${name}`] = stats;
    printStatsTable(name, stats, "bytes");

    if (stats) {
      console.log(`  → ${(stats.median / 1024 / 1024).toFixed(2)} MB (median)`);
    }
  }
}

// Bundle sizes
const bundlePath = path.join(dir, "bundle_sizes.json");
if (fs.existsSync(bundlePath)) {
  const bundles = JSON.parse(fs.readFileSync(bundlePath, "utf8"));

  console.log(`\n${"=".repeat(60)}`);
  console.log("Bundle Sizes (static, uncompressed)");
  console.log("=".repeat(60));

  const sorted = Object.entries(bundles).sort((a, b) => b[1] - a[1]);
  let total = 0;

  for (const [file, size] of sorted) {
    total += size;
    console.log(`  ${(size / 1024 / 1024).toFixed(2)} MB  ${file}`);
  }
  console.log(`  ${"─".repeat(40)}`);
  console.log(`  ${(total / 1024 / 1024).toFixed(2)} MB  TOTAL`);

  summary["bundle_total_bytes"] = { value: total };
}

// JSON保存
const summaryPath = path.join(dir, "summary.json");
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(`\nSummary saved to: ${summaryPath}`);
