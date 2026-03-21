#!/usr/bin/env node
/**
 * generate-score-comment.mjs
 *
 * Reads N score output files (plain-text output from the scoring tool),
 * parses per-target scores, computes median/min/max across runs,
 * optionally compares against a baseline JSON file,
 * and writes a rich Markdown comment.
 *
 * Usage:
 *   node generate-score-comment.mjs \
 *     --runs /tmp/score-1.txt,/tmp/score-2.txt \
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
//
// The scoring tool emits box-drawing tables like:
//   │ テスト項目     │ CLS (25点) │ FCP (10点) │ … │ 合計 (100点) │
//   ├───────…────────┼────────…───┼────────…───┼───┼──────────…───┤
//   │ ホームを開く   │ 25.00      │ 9.20       │ … │ 53.70        │
//   └───────…────────┴────────…───┴────────…───┴───┴──────────…───┘
//
// Grand total line: "合計 808.40 / 1150.00"
// Failure section:  "  * <page> | <reason>"  (under "### 計測できなかった原因")
// ---------------------------------------------------------------------------
function parseScoreOutput(text) {
  const targets = new Map();
  const failures = new Map(); // page name -> reason string

  // Reconstruct logical lines — CI log lines may wrap mid-row
  const rawLines = text.split("\n");
  const lines = [];
  for (const raw of rawLines) {
    const t = raw.trim();
    if (t.startsWith("│")) {
      lines.push(t);
    } else if (
      lines.length > 0 &&
      !t.startsWith("┌") && !t.startsWith("├") && !t.startsWith("└") &&
      t !== ""
    ) {
      const last = lines[lines.length - 1];
      if (last.startsWith("│")) {
        lines[lines.length - 1] = last + t;
        continue;
      }
      lines.push(t);
    } else {
      lines.push(t);
    }
  }

  function splitBoxRow(line) {
    return line
      .split("│")
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1);
  }

  let headerCols = null;
  let currentSection = "standard"; // "standard" | "userflow"
  let inFailureSection = false;

  for (const line of lines) {
    if (line.includes("計測できなかった原因")) { inFailureSection = true; continue; }
    if (line.includes("ユーザーフローテスト")) { currentSection = "userflow"; inFailureSection = false; continue; }
    if (line.includes("通常テスト")) { currentSection = "standard"; inFailureSection = false; continue; }
    if (line.startsWith("####") || line.startsWith("###")) { inFailureSection = false; }

    // Failure entries: "  * <page> | <reason>"
    if (inFailureSection) {
      const failMatch = line.match(/^\s*\*\s+(.+?)\s*\|\s*(.*)/);
      if (failMatch) {
        failures.set(failMatch[1].trim(), failMatch[2].trim());
      }
      continue;
    }

    if (!line.startsWith("│")) continue;

    const cells = splitBoxRow(line);
    if (cells.length === 0) continue;

    // Header row
    if (cells[0] === "テスト項目") {
      headerCols = cells.slice(1);
      continue;
    }

    // Data row
    if (headerCols && cells.length === headerCols.length + 1) {
      const name = cells[0];
      const values = cells.slice(1);
      const totalStr = values[values.length - 1];
      const total = (totalStr === "計測できません" || totalStr === "-") ? null : parseFloat(totalStr);

      const metrics = new Map();
      for (let i = 0; i < headerCols.length - 1; i++) {
        const keyMatch = headerCols[i].match(/^([A-Za-z]+)/);
        if (keyMatch) {
          const key = keyMatch[1].toLowerCase();
          const val = (values[i] === "-" || values[i] === "") ? null : parseFloat(values[i]);
          metrics.set(key, val);
        }
      }

      targets.set(name, { total, metrics, section: currentSection });
    }
  }

  // Grand total: "合計 808.40 / 1150.00"
  const totalMatch = text.match(/^合計\s+([\d.]+)\s*\/\s*([\d.]+)/m);
  const grandTotal = totalMatch ? parseFloat(totalMatch[1]) : null;
  const grandMax = totalMatch ? parseFloat(totalMatch[2]) : null;

  return { targets, grandTotal, grandMax, failures };
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

function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
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
  if (current == null || base == null) return "➖";
  const diff = current - base;
  if (diff > 1) return "🟢";
  if (diff > 0.005) return "🟡";
  if (diff < -1) return "🔴";
  if (diff < -0.005) return "🟠";
  return "⬜";
}

// High variance: range > 20% of median
const VARIANCE_THRESHOLD = 0.20;

function isHighVariance(stats) {
  if (!stats || stats.min == null || stats.max == null || stats.med == null || stats.med === 0) return false;
  return (stats.max - stats.min) / stats.med > VARIANCE_THRESHOLD;
}

// ---------------------------------------------------------------------------
// Load and parse all run files
// ---------------------------------------------------------------------------
const runResults = runFiles.map((f) => {
  try {
    return parseScoreOutput(readFileSync(f, "utf8"));
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
const allTargetNames = [...runResults[0].targets.keys()];

const aggregated = new Map();

for (const name of allTargetNames) {
  const totals = runResults.map((r) => r.targets.get(name)?.total).filter((v) => v != null);
  const totalStats = totals.length > 0
    ? { med: median(totals), min: Math.min(...totals), max: Math.max(...totals), stddev: stddev(totals) }
    : null;

  const firstRun = runResults.find((r) => r.targets.has(name));
  const metricKeys = firstRun ? [...firstRun.targets.get(name).metrics.keys()] : [];

  const metricsAgg = new Map();
  for (const key of metricKeys) {
    const vals = runResults.map((r) => r.targets.get(name)?.metrics.get(key)).filter((v) => v != null);
    if (vals.length > 0) {
      metricsAgg.set(key, { med: median(vals), min: Math.min(...vals), max: Math.max(...vals), stddev: stddev(vals) });
    }
  }

  const section = firstRun?.targets.get(name)?.section ?? "standard";
  aggregated.set(name, { total: totalStats, metrics: metricsAgg, section });
}

// Grand totals
const grandTotals = runResults.map((r) => r.grandTotal).filter((v) => v != null);
const grandMax = runResults[0].grandMax;
const grandTotalStats = grandTotals.length > 0
  ? { med: median(grandTotals), min: Math.min(...grandTotals), max: Math.max(...grandTotals), stddev: stddev(grandTotals) }
  : null;

// Aggregate failure reasons across runs (union, pick first non-empty reason)
const allFailures = new Map();
for (const r of runResults) {
  for (const [page, reason] of r.failures) {
    if (!allFailures.has(page) || (!allFailures.get(page) && reason)) {
      allFailures.set(page, reason);
    }
  }
}

// ---------------------------------------------------------------------------
// Section split
// ---------------------------------------------------------------------------
const standardTargets = [];
const userFlowTargets = [];
for (const name of allTargetNames) {
  const section = runResults.find((r) => r.targets.has(name))?.targets.get(name)?.section ?? "standard";
  (section === "userflow" ? userFlowTargets : standardTargets).push(name);
}

// ---------------------------------------------------------------------------
// Save JSON for future baseline use
// ---------------------------------------------------------------------------
const nRuns = runResults.length;
const hasBaseline = baseline != null;
const baselineTargets = baseline?.targets ?? {};
const baselineCommit = baseline?.commit ? baseline.commit.slice(0, 8) : null;

const scoresJson = {
  commit: commitSha,
  grandTotal: grandTotalStats ? { med: grandTotalStats.med, min: grandTotalStats.min, max: grandTotalStats.max } : null,
  grandMax,
  targets: Object.fromEntries(
    [...aggregated.entries()].map(([name, { total, metrics, section }]) => [
      name,
      {
        total: total ? { med: total.med, min: total.min, max: total.max } : null,
        metrics: Object.fromEntries([...metrics.entries()].map(([k, v]) => [k, { med: v.med, min: v.min, max: v.max }])),
        section,
      },
    ])
  ),
};

if (jsonOutputFile) {
  writeFileSync(jsonOutputFile, JSON.stringify(scoresJson, null, 2));
}

// ---------------------------------------------------------------------------
// Stability score: 1 - (stddev / med) on grand total, expressed as percentage
// ---------------------------------------------------------------------------
const stabilityPct = grandTotalStats && grandTotalStats.med > 0 && nRuns > 1
  ? Math.max(0, Math.round((1 - grandTotalStats.stddev / grandTotalStats.med) * 100))
  : null;

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------

function minMedMax(stats) {
  if (!stats) return "-";
  if (nRuns === 1) return `**${fmt(stats.med)}**`;
  const warn = isHighVariance(stats) ? " ⚠️" : "";
  return `${fmt(stats.min)} / **${fmt(stats.med)}** / ${fmt(stats.max)}${warn}`;
}

// Most-changed metric vs baseline (by absolute point delta)
function biggestMetricDelta(name, metricsOrder) {
  if (!hasBaseline) return null;
  const agg = aggregated.get(name);
  const base = baselineTargets[name];
  if (!agg || !base) return null;

  let biggest = null;
  for (const key of metricsOrder) {
    const cur = agg.metrics.get(key)?.med ?? null;
    const b = base.metrics?.[key]?.med ?? null;
    if (cur == null || b == null) continue;
    const diff = Math.abs(cur - b);
    if (biggest == null || diff > biggest.diff) {
      biggest = { key: key.toUpperCase(), cur, b, diff, raw: cur - b };
    }
  }
  return biggest;
}

// ---------------------------------------------------------------------------
// Score table (Page Display / Page Interaction)
// ---------------------------------------------------------------------------
function buildTable(targetNames, metricsOrder) {
  const metricHeaders = metricsOrder.map((k) => k.toUpperCase()).join(" | ");
  let header = `| Page | ${metricHeaders} | Score |`;
  let sep    = `|:---|${metricsOrder.map(() => "---:").join("|")}|---:|`;
  if (hasBaseline) {
    header += " vs Baseline | Biggest Δ |";
    sep    += "---:|:---|";
  }

  const rows = targetNames.map((name) => {
    const agg = aggregated.get(name);
    const highVar = isHighVariance(agg?.total);
    const label = highVar ? `${name} ⚠️` : name;

    if (!agg) {
      const empty = metricsOrder.map(() => "-").join(" | ");
      return `| ${label} | ${empty} | - |${hasBaseline ? " - | — |" : ""}`;
    }

    const metricCells = metricsOrder.map((key) => minMedMax(agg.metrics.get(key)));
    const scoreCell = minMedMax(agg.total);
    let row = `| ${label} | ${metricCells.join(" | ")} | ${scoreCell} |`;

    if (hasBaseline) {
      const baseMed = baselineTargets[name]?.total?.med ?? null;
      const curMed = agg.total?.med ?? null;

      if (baseMed != null && curMed == null) {
        // Previously scored, now failing — regression
        row += ` 🔴 **REGRESSION** (was ${fmt(baseMed)}) | — |`;
      } else {
        const emoji = deltaEmoji(curMed, baseMed);
        const d = delta(curMed, baseMed);
        const bd = biggestMetricDelta(name, metricsOrder);
        const bdStr = bd && Math.abs(bd.raw) >= 0.01
          ? `${bd.key}: ${bd.raw > 0 ? "+" : ""}${bd.raw.toFixed(2)} (${fmt(bd.b)}→${fmt(bd.cur)})`
          : "—";
        row += ` ${emoji} ${d} | ${bdStr} |`;
      }
    }

    return row;
  });

  return [header, sep, ...rows].join("\n");
}

// ---------------------------------------------------------------------------
// Individual run details table
// ---------------------------------------------------------------------------
function buildRunTable(targetNames) {
  const cols = ["Total", ...targetNames];
  const header = `| Run | ${cols.join(" | ")} |`;
  const sep    = `|:---|${cols.map(() => "---:").join("|")}|`;
  const rows = [];

  // Baseline row
  if (hasBaseline) {
    const cells = cols.map((name) =>
      name === "Total" ? fmt(baseline.grandTotal?.med) : fmt(baselineTargets[name]?.total?.med)
    );
    const label = `Baseline (main${baselineCommit ? ` \`@${baselineCommit}\`` : ""})`;
    rows.push(`| ${label} | ${cells.join(" | ")} |`);
  }

  // Per-run rows
  runResults.forEach((r, i) => {
    const cells = cols.map((name) =>
      name === "Total" ? fmt(r.grandTotal) : fmt(r.targets.get(name)?.total)
    );
    rows.push(`| Run ${i + 1} | ${cells.join(" | ")} |`);
  });

  // Median row
  const medCells = cols.map((name) => {
    if (name === "Total") return grandTotalStats ? `**${fmt(grandTotalStats.med)}**` : "-";
    const t = aggregated.get(name)?.total;
    return t ? `**${fmt(t.med)}**` : "-";
  });
  rows.push(`| **median** | ${medCells.join(" | ")} |`);

  // vs baseline row
  if (hasBaseline) {
    const deltaCells = cols.map((name) => {
      let cur, base;
      if (name === "Total") {
        cur = grandTotalStats?.med ?? null;
        base = baseline.grandTotal?.med ?? null;
      } else {
        cur = aggregated.get(name)?.total?.med ?? null;
        base = baselineTargets[name]?.total?.med ?? null;
      }
      if (base != null && cur == null) return "🔴 N/A";
      const emoji = deltaEmoji(cur, base);
      const d = delta(cur, base);
      return `${emoji} ${d}`;
    });
    rows.push(`| **vs baseline** | ${deltaCells.join(" | ")} |`);
  }

  return [header, sep, ...rows].join("\n");
}

// ---------------------------------------------------------------------------
// Failed / Unmeasured table
// ---------------------------------------------------------------------------
function buildFailureTable() {
  if (allFailures.size === 0) return null;
  const rows = [...allFailures.entries()].map(([page, reason]) => {
    const baseMed = baselineTargets[page]?.total?.med ?? null;
    const curMed = aggregated.get(page)?.total?.med ?? null;
    let label = page;
    if (hasBaseline && baseMed != null && curMed == null) {
      label += ` 🔴 **REGRESSION** (was ${fmt(baseMed)} on baseline)`;
    }
    return `| ${label} | ${reason || "—"} |`;
  });
  return ["| Page | Reason |", "|:---|:---|", ...rows].join("\n");
}

// ---------------------------------------------------------------------------
// Assemble comment
// ---------------------------------------------------------------------------
let comment = `<!-- wsh-score-result -->
## Web Speed Hackathon 2026 — Score Report

${nRuns > 1 ? `_(${nRuns} runs — min / median / max shown)_` : `_(single run)_`}
`;

if (commitSha) {
  comment += hasBaseline && baselineCommit
    ? `> Commit: \`${commitSha.slice(0, 8)}\` vs baseline \`${baselineCommit}\` (main)\n`
    : `> Commit: \`${commitSha.slice(0, 8)}\`\n`;
}
comment += "\n";

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

  if (stabilityPct != null) {
    totalLine += `  📊 stability: ${stabilityPct}%`;
  }

  comment += totalLine + "\n\n";
}

if (standardTargets.length > 0) {
  comment += `#### Page Display (900 pts max)\n\n`;
  comment += buildTable(standardTargets, ["fcp", "si", "lcp", "tbt", "cls"]);
  comment += "\n\n";
}

if (userFlowTargets.length > 0) {
  comment += `#### Page Interaction (250 pts max)\n\n`;
  comment += buildTable(userFlowTargets, ["tbt", "inp"]);
  comment += "\n\n";
}

const allScoredTargets = [...standardTargets, ...userFlowTargets];
if (nRuns > 1 || hasBaseline) {
  comment += `#### Individual Run Details\n\n`;
  comment += buildRunTable(allScoredTargets);
  comment += "\n\n";
}

const failureTable = buildFailureTable();
if (failureTable) {
  comment += `#### Failed / Unmeasured\n\n`;
  comment += failureTable;
  comment += "\n\n";
}

const hasAnyVariance = allScoredTargets.some((n) => isHighVariance(aggregated.get(n)?.total));
if (hasAnyVariance) {
  comment += `> ⚠️ Pages marked ⚠️ have high variance (range > ${Math.round(VARIANCE_THRESHOLD * 100)}% of median) — results may be unreliable.\n\n`;
}

if (!hasBaseline) {
  comment += `> _No baseline available. Merge to \`main\` first to establish baseline._\n`;
}

comment += `\n---\n_${new Date().toISOString()}_`;

if (outputFile) {
  writeFileSync(outputFile, comment);
} else {
  process.stdout.write(comment);
}
