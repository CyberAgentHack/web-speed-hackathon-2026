## アプリケーションのデプロイ方法

提出用環境の作成は、以下のいずれかの手順でローカルのアプリケーションをデプロイすることで行えます。
なお、スコア計測中にデプロイを行うと正しく採点されないことがありますので、注意してください。

### fly.io

1. このレポジトリを自分のレポジトリに fork します
   - https://docs.github.com/ja/github/getting-started-with-github/fork-a-repo
2. fork したレポジトリから [CyberAgentHack/web-speed-hackathon-2026](https://github.com/CyberAgentHack/web-speed-hackathon-2026/) へ Pull Request を作成します
   - https://docs.github.com/ja/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork
3. GitHub Actions により自動的に fly.io へデプロイされます
4. アプリケーションへは Pull Request 下部の `View Deployment` からアクセスできます

> [!NOTE]
>
> デプロイプロセスまたはアプリケーション起動プロセスでエラーが発生した場合
>
> エラーによりデプロイしようとしたアプリケーションにアクセスできない場合は、運営から提供されるアクセストークンを指定して [`fly logs`](https://fly.io/docs/flyctl/logs/) を実行することで、ログを確認できます。
>
> ```bash
> fly logs --app pr-<PR 番号>-web-speed-hackathon-2026 --access-token <アクセストークン>
> ```

> [!CAUTION]
>
> **`fly.toml` の内容を変更してはならない**
>
> `fly.toml` を変更した場合、順位対象外となります。

### fly.io 以外へのデプロイ

> [!WARNING]
>
> **発生した費用は自己負担となります**

レギュレーションを満たし、採点が可能であれば fly.io 以外へデプロイしても構いません。
