import * as github from "@actions/github";
import { defineCommand, runMain } from "citty";
import { stripIndents } from "common-tags";
import debug from "debug";
import { inject } from "regexparam";

import { calculate, TARGET_NAME_LIST } from "./calculate";
import { consola } from "./consola";
import { Reporter } from "./reporting/reporter";
import type { MetricKey, Result, TargetCategory } from "./result";
import { CLIWriter } from "./writer/cli_writer";
import { EmptyWriter } from "./writer/empty_writer";
import { GitHubWriter } from "./writer/github_writer";
import { sum, round } from 'lodash'

const SCORE_SECTION_LIST: Array<{
  category: TargetCategory;
  metrics: Array<{ key: MetricKey; label: string; maxScore: number }>;
  totalMaxScore: number;
  title: string;
}> = [
  {
    category: "standard",
    metrics: [
      { key: "cls", label: "CLS", maxScore: 25 },
      { key: "fcp", label: "FCP", maxScore: 10 },
      { key: "lcp", label: "LCP", maxScore: 25 },
      { key: "si", label: "SI", maxScore: 10 },
      { key: "tbt", label: "TBT", maxScore: 30 },
    ],
    totalMaxScore: 100,
    title: "通常テスト",
  },
  {
    category: "userFlow",
    metrics: [
      { key: "inp", label: "INP", maxScore: 25 },
      { key: "tbt", label: "TBT", maxScore: 25 },
    ],
    totalMaxScore: 50,
    title: "ユーザーフローテスト",
  },
];

function formatMetricScore(result: Result, metricKey: MetricKey): string {
  if (result.error != null) {
    return "-";
  }

  const metric = result.breakdown.find(({ key }) => key === metricKey);
  if (metric == null) {
    return "-";
  }

  return `${(metric.earnedX100 / 100).toFixed(2)}`;
}

function formatScoreSection({
  metrics,
  results,
  totalMaxScore,
  title,
}: {
  metrics: Array<{ key: MetricKey; label: string; maxScore: number }>;
  results: Result[];
  totalMaxScore: number;
  title: string;
}): string {
  const scoreTable = [
    `|テスト項目|${metrics.map(({ label, maxScore }) => `${label} (${maxScore}点)`).join("|")}|合計 (${totalMaxScore}点)|`,
    `|:---|${metrics.map(() => "---:").join("|")}|---:|`,
    ...results.map((result) => {
      const { error, scoreX100, target } = result;
      const metricScoreTextList = metrics.map(({ key }) => formatMetricScore(result, key));
      const scoreText = error != null ? "計測できません" : `${(scoreX100 / 100).toFixed(2)}`;
      return `| ${target.name} | ${metricScoreTextList.join(" | ")} | ${scoreText} |`;
    }),
  ].join("\n");

  return [`#### ${title}`, "", scoreTable].join("\n");
}

function formatScoreTable(results: Result[]): string {
  return SCORE_SECTION_LIST.flatMap(({ category, metrics, title, totalMaxScore }) => {
    const sectionResults = results.filter((result) => result.target.category === category);
    if (sectionResults.length === 0) {
      return [];
    }

    return formatScoreSection({
      metrics,
      results: sectionResults,
      totalMaxScore,
      title,
    });
  }).join("\n\n");
}

const command = defineCommand({
  args: {
    applicationUrl: {
      description:
        "計測対象の Web アプリケーションの URL を指定します。(例: http://localhost:3000)",
      required: true,
      type: "string",
    },
    competitionEndAt: {
      required: false,
      type: "string",
      valueHint: "2026-01-01T00:00:00.000+09:00",
    },
    competitionStartAt: {
      required: false,
      type: "string",
      valueHint: "2026-01-01T00:00:00.000+09:00",
    },
    dashboardServerToken: {
      required: false,
      type: "string",
    },
    dashboardServerUrl: {
      required: false,
      type: "string",
      valueHint: "https://scoring-board.example/",
    },
    participationGitHubId: {
      required: false,
      type: "string",
    },
    participationKind: {
      required: false,
      type: "string",
      valueHint: "学生 | 一般",
    },
    targetName: {
      description:
        "計測名を指定すると、その計測のみを実行します。計測名を省略すると利用可能な計測名を表示します。",
      required: false,
      type: "string",
    },
  },
  meta: {
    description: "Scoring tool for Web Speed Hackathon 2026",
    name: "@web-speed-hackathon-2026/scoring-tool",
  },
  async run({
    args: {
      applicationUrl,
      targetName,
      competitionEndAt = null,
      competitionStartAt = null,
      dashboardServerToken = null,
      dashboardServerUrl = null,
      participationGitHubId = null,
      participationKind = null,
    },
  }) {
    async function sendScoreToDashboard(score: number): Promise<{ rank: number | null }> {
      if (!dashboardServerUrl || !dashboardServerToken || !participationGitHubId) {
        return { rank: null };
      }

      const requestUrl = new URL(
        inject("/api/scores/:userId", {
          userId: participationGitHubId,
        }),
        dashboardServerUrl,
      );
      const res = await fetch(requestUrl, {
        body: JSON.stringify({
          kind: participationKind === "学生" ? "STUDENT" : "GENERAL",
          previewUrl: applicationUrl,
          score,
        }),
        headers: {
          "Content-Type": "application/json",
          Token: dashboardServerToken,
        },
        method: "POST",
      });

      if (res.status !== 200) {
        return { rank: null };
      }
      return res.json() as Promise<{ rank: number }>;
    }

    const writer = (() => {
      if (debug.enabled("wsh:log")) {
        return new EmptyWriter();
      }
      if (process.env["GITHUB_ACTIONS"] != null) {
        return new GitHubWriter({
          github,
          octokit: github.getOctokit(process.env["GITHUB_TOKEN"]!),
        });
      }
      return new CLIWriter();
    })();

    const reporter = new Reporter({ writer });
    await reporter.initialize();

    const requestedDate =
      process.env["GITHUB_ACTIONS"] != null
        ? new Date(
            (github.context.eventName === "issues"
              ? github.context.payload.issue!["created_at"]
              : github.context.payload.comment!["created_at"]) as number,
          )
        : new Date();

    if (competitionStartAt != null && requestedDate < new Date(competitionStartAt)) {
      await reporter.appendArea("fatalError", "❌ 競技開始前です");
      return;
    }
    if (competitionEndAt != null && new Date(competitionEndAt) <= requestedDate) {
      await reporter.appendArea("fatalError", "❌ 競技は終了しました");
      return;
    }

    const normalizedTargetName = targetName?.trim();
    const targetListText = [
      "利用可能な計測名:",
      ...TARGET_NAME_LIST.map((name) => `- \`${name}\``),
    ].join("\n");

    if (normalizedTargetName === "") {
      await reporter.appendArea("fatalError", ["計測名一覧", "", targetListText].join("\n"));
      return;
    }

    if (
      normalizedTargetName != null &&
      TARGET_NAME_LIST.some((name) => name.includes(normalizedTargetName)) === false
    ) {
      await reporter.appendArea(
        "fatalError",
        [
          `❌ 指定された計測名 \`${normalizedTargetName}\` に部分一致する計測がありません`,
          "",
          targetListText,
        ].join("\n"),
      );
      return;
    }

    try {
      new URL("/api/v1/initialize", applicationUrl);
    } catch {
      await reporter.appendArea(
        "fatalError",
        `❌ 与えられた URL \`${applicationUrl}\` が正しくありません`,
      );
      return;
    }

    try {
      const res = await fetch(new URL("/api/v1/initialize", applicationUrl), {
        method: "POST",
      });
      if (res.status !== 200 && res.status !== 204) {
        throw new Error(`Initialize error: ${res.status}`);
      }
    } catch (err) {
      consola.error(err);
      await reporter.appendArea(
        "fatalError",
        "❌ 初期化 API `/api/v1/initialize` にアクセスできません",
      );
      return;
    }

    try {
      const results: Result[] = [];

      for await (const result of calculate({
        baseUrl: applicationUrl,
        targetName: normalizedTargetName,
      })) {
        results.push(result);

        if (result.error != null) {
          await reporter.appendArea(
            "errorList",
            `- **${result.target.name}** | ${result.error.message.replaceAll("\n", "").slice(0, 100)}`,
          );
        }

        await reporter.setArea("scoreTable", formatScoreTable(results));
      }

      {
        const totalScore = round(
          sum(results.map(({ scoreX100 }) => scoreX100)) / 100,
          2
        )

        const totalMaxScore = sum(results.map(({ target }) => target.maxScore));

        const { rank } = await sendScoreToDashboard(totalScore);

        if (rank != null) {
          const shareUrl = new URL("https://x.com/intent/tweet");
          shareUrl.searchParams.set(
            "text",
            stripIndents`
            "Web Speed Hackathon 2026" に挑戦中です！
            スコア: ${totalScore.toFixed(2)} / ${totalMaxScore.toFixed(2)}
            現在 ${rank} 位です
          `,
          );
          shareUrl.searchParams.set(
            "url",
            "https://github.com/CyberAgentHack/web-speed-hackathon-2026",
          );
          shareUrl.searchParams.set("hashtags", "WebSpeedHackathon");

          await reporter.setArea(
            "result",
            stripIndents`
            **合計 ${totalScore.toFixed(2)} / ${totalMaxScore.toFixed(2)}**
            **（暫定 ${rank} 位）**

            - [**Xで結果を投稿しよう！**](${shareUrl.href})
          `,
          );
        } else {
          await reporter.setArea(
            "result",
            stripIndents`
            **合計 ${totalScore.toFixed(2)} / ${totalMaxScore.toFixed(2)}**
          `,
          );
        }
      }
    } catch (err) {
      await reporter.appendArea("fatalError", "❌ 計測に失敗しました、運営にご連絡ください");
      throw err;
    }
  },
});

runMain(command)
  .then(() => {
    process.exit(0);
  })
  .catch((err: unknown) => {
    consola.error(err);
    process.exit(1);
  });
