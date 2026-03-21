#!/usr/bin/env node
/**
 * generate-score-comment.mjs
 *
 * Reads N score output files (plain-text Markdown from the scoring tool),
 * parses per-target scores, computes median/min/max across runs,
 * optionally compares against a baseline JSON file,
 * and writes a rich Markdown comment to stdout.
 *
 * Usage:
 *   node generate-score-comment.mjs \
 *     --runs /tmp/score-1.txt,/tmp/score-2.txt,/tmp/score-3.txt \
 *     [--baseline /tmp/baseline-scores.json] \
 *     [--commit abc1234] \
 *     [--output /tmp/comment.md] \
 *     [--json-output /tmp/scores.json]
 */

import { readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
}

const runFiles = (getArg("runs") ?? "").split(",").filter(Boolean);
const baselineFile = getArg("baseline");
const commitSha = getArg("commit") ?? "";
const outputFile = getArg("output");
const jsonOutputFile = getArg("json-output");

if (runFiles.length === 0) {
  console.error("ERROR: --runs is required");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Parse a scoring tool output file
// Returns: { targets: Map<name, { total, metrics: Map<key, value> }> }
// ---------------------------------------------------------------------------
function parseScoreOutput(text) {
  const targets = new Map();

  // Extract table rows — lines like:  | テスト名 | 0.00 | 0.00 | ... |
  // We process each table independently to know which columns are which.
  const lines = text.split("\n");

  let headerCols = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;

    const cells = trimmed
      .split("|")
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1); // remove empty first/last

    if (cells.length === 0) continue;

    // Separator row
    if (cells.every((c) => /^:?-+:?$/.test(c))) {
      continue;
    }

    // Header row — first cell is "テスト項目"
    if (cells[0] === "テスト項目") {
      // e.g. ["テスト項目", "CLS (25点)", "FCP (10点)", ..., "合計 (100点)"]
      headerCols = cells.slice(1); // skip "テスト項目"
      continue;
    }

    // Data row
    if (headerCols && cells.length === headerCols.length + 1) {
      const name = cells[0];
      const values = cells.slice(1);
      const totalStr = values[values.length - 1];
      const total = totalStr === "計測できません" ? null : parseFloat(totalStr);

      const metrics = new Map();
      for (let i = 0; i < headerCols.length - 1; i++) {
        const header = headerCols[i]; // e.g. "CLS (25点)"
        const keyMatch = header.match(/^(\w+)/);
        if (keyMatch) {
          const key = keyMatch[1].toLowerCase();
          const val = values[i] === "-" ? null : parseFloat(values[i]);
          metrics.set(key, val);
        }
      }

      targets.set(name, { total, metrics });
    }
  }

  // Extract overall total from "**合計 X.XX / Y.YY**"
  const totalMatch = text.match(/\*\*合計\s+([\d.]+)\s*\/\s*([\d.]+)\*\*/);
  const grandTotal = totalMatch ? parseFloat(totalMatch[1]) : null;
  const grandMax = totalMatch ? parseFloat(totalMatch[2]) : null;

  return { targets, grandTotal, grandMax };
}

// ---------------------------------------------------------------------------
// Statistics helpers
// ---------------------------------------------------------------------------
function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function fmt(val, decimals = 2) {
  if (val == null) return "-";
  return val.toFixed(decimals);
}

function delta(current, base) {
  if (current == null || base == null) return "";
  const diff = current - base;
  if (Math.abs(diff) < 0.005) return "±0.00";
  return diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
}

function deltaEmoji(current, base) {
  if (current == null || base == null) return "";
  const diff = current - base;
  if (diff > 1) return "🟢";
  if (diff > 0.005) return "🟡";
  if (diff < -1) return "🔴";
  if (diff < -0.005) return "🟠";
  return "⬜";
}

// ---------------------------------------------------------------------------
// Load and parse all run files
// ---------------------------------------------------------------------------
const runResults = runFiles.map((f) => {
  try {
    const text = readFileSync(f, "utf8");
    return parseScoreOutput(text);
  } catch (e) {
    console.error(`WARNING: Could not read ${f}: ${e.message}`);
    return null;
  }
}).filter(Boolean);

if (runResults.length === 0) {
  console.error("ERROR: No valid score files found");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Load baseline (optional)
// ---------------------------------------------------------------------------
let baseline = null;
if (baselineFile) {
  try {
    baseline = JSON.parse(readFileSync(baselineFile, "utf8"));
  } catch (e) {
    console.error(`WARNING: Could not load baseline: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// Aggregate across runs per target
// ---------------------------------------------------------------------------
// Collect all target names in order (from first successful run)
const allTargetNames = [...runResults[0].targets.keys()];

// For each target, gather per-metric values across runs
const aggregated = new Map(); // name -> { total: {med, min, max}, metrics: Map<key, {med,min,max}> }

for (const name of allTargetNames) {
  const totals = runResults
    .map((r) => r.targets.get(name)?.total)
    .filter((v) => v != null);
  const totalStats =
    totals.length > 0
      ? { med: median(totals), min: Math.min(...totals), max: Math.max(...totals) }
      : null;

  // Collect metric keys from first run that has this target
  const firstRun = runResults.find((r) => r.targets.has(name));
  const metricKeys = firstRun ? [...firstRun.targets.get(name).metrics.keys()] : [];

  const metricsAgg = new Map();
  for (const key of metricKeys) {
    const vals = runResults
      .map((r) => r.targets.get(name)?.metrics.get(key))
      .filter((v) => v != null);
    if (vals.length > 0) {
      metricsAgg.set(key, {
        med: median(vals),
        min: Math.min(...vals),
        max: Math.max(...vals),
      });
    }
  }

  aggregated.set(name, { total: totalStats, metrics: metricsAgg });
}

// Grand totals across runs
const grandTotals = runResults.map((r) => r.grandTotal).filter((v) => v != null);
const grandMax = runResults[0].grandMax;
const grandTotalStats =
  grandTotals.length > 0
    ? { med: median(grandTotals), min: Math.min(...grandTotals), max: Math.max(...grandTotals) }
    : null;

// ---------------------------------------------------------------------------
// Save JSON for future baseline use
// ---------------------------------------------------------------------------
const scoresJson = {
  commit: commitSha,
  grandTotal: grandTotalStats,
  grandMax,
  targets: Object.fromEntries(
    [...aggregated.entries()].map(([name, { total, metrics }]) => [
      name,
      {
        total,
        metrics: Object.fromEntries([...metrics.entries()]),
      },
    ])
  ),
};

if (jsonOutputFile) {
  writeFileSync(jsonOutputFile, JSON.stringify(scoresJson, null, 2));
}

// ---------------------------------------------------------------------------
// Determine which targets belong to which section
// Detect by checking if a target has INP metric (userFlow) or not (standard)
// ---------------------------------------------------------------------------
const standardTargets = [];
const userFlowTargets = [];

for (const [name, { metrics }] of aggregated.entries()) {
  if (metrics.has("inp")) {
    userFlowTargets.push(name);
  } else {
    standardTargets.push(name);
  }
}

// ---------------------------------------------------------------------------
// Build comment Markdown
// ---------------------------------------------------------------------------
const nRuns = runResults.length;
const stabilityNote =
  nRuns > 1
    ? `_(median of ${nRuns} runs — min / median / max shown)_`
    : `_(single run)_`;

function buildTable(targetNames, metricsOrder, hasBaseline) {
  const baselineTargets = baseline?.targets ?? {};

  // Header
  const metricHeaders = metricsOrder.map((k) => k.toUpperCase()).join(" | ");
  const hasBaselineCol = hasBaseline && baseline != null;

  let header = `| Page | ${metricHeaders} | Score |`;
  let sep = `|:---|${metricsOrder.map(() => "---:").join("|")}|---:|`;
  if (hasBaselineCol) {
    header += " vs Baseline |";
    sep += "---:|";
  }

  const rows = targetNames.map((name) => {
    const agg = aggregated.get(name);
    if (!agg) return `| ${name} | ${metricsOrder.map(() => "-").join(" | ")} | - |`;

    const metricCells = metricsOrder.map((key) => {
      const m = agg.metrics.get(key);
      if (!m) return "-";
      if (nRuns > 1) {
        return `${fmt(m.min)} / **${fmt(m.med)}** / ${fmt(m.max)}`;
      }
      return fmt(m.med);
    });

    let scoreCell;
    if (!agg.total) {
      scoreCell = "-";
    } else if (nRuns > 1) {
      scoreCell = `${fmt(agg.total.min)} / **${fmt(agg.total.med)}** / ${fmt(agg.total.max)}`;
    } else {
      scoreCell = `**${fmt(agg.total.med)}**`;
    }

    let row = `| ${name} | ${metricCells.join(" | ")} | ${scoreCell} |`;

    if (hasBaselineCol) {
      const base = baselineTargets[name]?.total?.med ?? baselineTargets[name]?.total?.med;
      const current = agg.total?.med ?? null;
      const d = delta(current, base);
      const emoji = deltaEmoji(current, base);
      row += ` ${emoji} ${d} |`;
    }

    return row;
  });

  return [header, sep, ...rows].join("\n");
}

const hasBaseline = baseline != null;

let comment = `<!-- wsh-score-result -->
## Web Speed Hackathon 2026 — Score Report

${stabilityNote}
${commitSha ? `> Commit: \`${commitSha.slice(0, 8)}\`` : ""}

`;

if (grandTotalStats) {
  const baseGrand = baseline?.grandTotal?.med ?? null;
  let totalLine = nRuns > 1
    ? `### Total: ${fmt(grandTotalStats.min)} / **${fmt(grandTotalStats.med)}** / ${fmt(grandTotalStats.max)} out of ${grandMax}`
    : `### Total: **${fmt(grandTotalStats.med)}** / ${grandMax}`;

  if (hasBaseline && baseGrand != null) {
    const d = delta(grandTotalStats.med, baseGrand);
    const emoji = deltaEmoji(grandTotalStats.med, baseGrand);
    totalLine += `  ${emoji} ${d} vs baseline (\`${fmt(baseGrand)}\`)`;
  }

  comment += totalLine + "\n\n";
}

if (standardTargets.length > 0) {
  comment += `#### Page Display (900 pts max)\n\n`;
  comment += buildTable(standardTargets, ["fcp", "si", "lcp", "tbt", "cls"], hasBaseline);
  comment += "\n\n";
}

if (userFlowTargets.length > 0) {
  comment += `#### Page Interaction (250 pts max)\n\n`;
  comment += buildTable(userFlowTargets, ["tbt", "inp"], hasBaseline);
  comment += "\n\n";
}

if (!hasBaseline) {
  comment += `> _No baseline available. Run on \`main\` branch to establish baseline._\n`;
}

comment += `\n---\n_${new Date().toISOString()}_`;

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
if (outputFile) {
  writeFileSync(outputFile, comment);
} else {
  process.stdout.write(comment);
}
