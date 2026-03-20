import { stripIndent } from "common-tags";

import type { Writer } from "./writer";

const FOOTER = stripIndent`
  ---

  ℹ️ もう一度計測する場合は、 \`/retry\` とコメントしてください
`;

type Options = {
  github: typeof import("@actions/github");
  octokit: ReturnType<typeof import("@actions/github").getOctokit>;
};

export class GitHubWriter implements Writer {
  private _options: Options;
  private _commentId: number | null = null;

  constructor(options: Options) {
    this._options = options;
  }

  async initialize(): Promise<void> {
    const { github, octokit } = this._options;

    await octokit.rest.issues.update({
      issue_number: github.context.payload.issue!.number,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      title: `[スコア] @${github.context.payload.issue!["user"].login}`,
    });
  }

  async update(markdown: string): Promise<void> {
    const { github, octokit } = this._options;

    if (this._commentId == null) {
      const { data: comment } = await octokit.rest.issues.createComment({
        body: `${markdown}\n\n${FOOTER}`,
        issue_number: github.context.payload.issue!.number,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
      });
      this._commentId = comment.id;
    } else {
      await octokit.rest.issues.updateComment({
        body: `${markdown}\n\n${FOOTER}`,
        comment_id: this._commentId,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
      });
    }
  }
}
