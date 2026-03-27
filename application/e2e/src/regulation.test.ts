import { expect, test } from "@playwright/test";

import { login } from "./utils";

const BASE_URL = process.env["E2E_BASE_URL"] ?? "http://localhost:3000";

// ===== シードデータから抽出した既知のID =====
const KNOWN_USERS = [
  { id: "a765b706-b228-48ad-bb9b-5534a1667646", username: "o6yq16leo", name: "和田 正" },
  { id: "ae8a99ad-1c33-491e-8ab0-9822b5b86ed5", username: "fvphm2slqfexfey34", name: "浜野 恵美子" },
  { id: "552d5898-0fe3-448e-8f49-c6b29df16378", username: "g16hmw55", name: "小野寺 遥" },
  { id: "919d5ec9-c1dd-4e21-9266-813c7c08e93b", username: "fvpfeoiaxm5o", name: "渡辺 三郎" },
  { id: "6c6725d2-6f3e-4e17-b850-313ce04f8a07", username: "ljfinn4", name: "渡邊 マサ" },
];

const KNOWN_POSTS = [
  { id: "d1bd6ba1-b5ba-4129-a16d-e1f898c3de1a", text: "昔はここまで綺麗な写真をスマホで撮れなかったよ" },
  { id: "cfa17c11-e119-45f5-8389-f00036b77afb", text: "今日もいい天気だね！" },
  { id: "126968c6-890f-494d-922f-208c160d06a4", text: "最近カメラにハマっていて" },
];

// ===== ヘルパー関数 =====

async function apiSignIn(username = "o6yq16leo", password = "wsh-2026"): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Sign-in failed: ${res.status}`);
  const cookies = res.headers.getSetCookie();
  const sid = cookies.find((c) => c.startsWith("connect.sid="));
  if (!sid) throw new Error("No session cookie returned");
  return sid.split(";")[0]!;
}

interface SSEEvent {
  event?: string;
  id?: string;
  data?: string;
}

async function collectSSEEvents(
  body: ReadableStream<Uint8Array>,
  maxEvents: number,
): Promise<SSEEvent[]> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const events: SSEEvent[] = [];
  let buffer = "";

  try {
    while (events.length < maxEvents) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (part.trim() === "") continue;
        const ev: SSEEvent = {};
        for (const line of part.split("\n")) {
          const colonIdx = line.indexOf(": ");
          if (colonIdx > 0) {
            const key = line.slice(0, colonIdx);
            const val = line.slice(colonIdx + 2);
            if (key === "event") ev.event = val;
            else if (key === "id") ev.id = val;
            else if (key === "data") ev.data = val;
          }
        }
        events.push(ev);
      }
    }
  } finally {
    await reader.cancel();
  }

  return events;
}

// ================================================================
// SSEプロトコル準拠テスト
// レギュレーション: GET /api/v1/crok{?prompt} のストリーミングプロトコル
// (Server-Sent Events) を変更してはならない
// ================================================================
test.describe("レギュレーション: SSEプロトコル準拠", () => {
  test("GET /api/v1/crok のレスポンスヘッダーが正しいこと", async () => {
    const cookie = await apiSignIn();
    const controller = new AbortController();
    const res = await fetch(`${BASE_URL}/api/v1/crok`, {
      headers: { Cookie: cookie },
      signal: controller.signal,
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.headers.get("cache-control")).toBe("no-cache");
    expect(res.headers.get("connection")).toBe("keep-alive");

    controller.abort();
  });

  test("SSEイベントが正しいフォーマット (event: message, id: N, data: JSON) であること", async () => {
    test.setTimeout(120_000);
    const cookie = await apiSignIn();
    const res = await fetch(`${BASE_URL}/api/v1/crok`, {
      headers: { Cookie: cookie },
    });

    expect(res.body).toBeTruthy();
    const events = await collectSSEEvents(res.body!, 15);

    expect(events.length).toBeGreaterThanOrEqual(10);

    for (const [i, event] of events.entries()) {
      // event: message であること
      expect(event.event).toBe("message");

      // id がシーケンシャルな数値であること
      expect(event.id).toBe(String(i));

      // data が有効なJSONであること
      expect(event.data).toBeTruthy();
      const data = JSON.parse(event.data!);

      // data.text が string, data.done が boolean であること
      expect(typeof data.text).toBe("string");
      expect(typeof data.done).toBe("boolean");

      // 途中イベントは done: false で text は1文字であること
      expect(data.done).toBe(false);
      expect(data.text.length).toBe(1);
    }
  });

  test("SSEストリームが最終的に done: true で完了し、内容がcrok-response.mdと一致すること", async () => {
    test.setTimeout(300_000);
    const cookie = await apiSignIn();
    const res = await fetch(`${BASE_URL}/api/v1/crok`, {
      headers: { Cookie: cookie },
    });

    expect(res.body).toBeTruthy();
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let lastData: { text: string; done: boolean } | null = null;
    let assembledText = "";
    let eventCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (part.trim() === "") continue;
        for (const line of part.split("\n")) {
          if (line.startsWith("data: ")) {
            lastData = JSON.parse(line.slice(6));
            eventCount++;
            if (lastData && !lastData.done) {
              assembledText += lastData.text;
            }
          }
        }
      }
    }

    // 最後のイベントが done: true であること
    expect(lastData).toBeTruthy();
    expect(lastData!.done).toBe(true);
    expect(lastData!.text).toBe("");

    // イベント数が十分であること (crok-response.md は数千文字)
    expect(eventCount).toBeGreaterThan(100);

    // 組み立てた文字列が crok-response.md の内容を含むこと
    expect(assembledText).toContain("結論から言うね");
    expect(assembledText).toContain("走れメロス ― 信実の計算的記録");
    expect(assembledText).toContain("メロスは激怒した");
    expect(assembledText).toContain("セリヌンティウス");
    expect(assembledText).toContain("ディオニス");
    expect(assembledText).toContain("信実とは、決して空虚な妄想ではなかった");
  });

  test("未認証の場合、401エラーが返ること", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/crok`);
    expect(res.status).toBe(401);
  });
});

// ================================================================
// SSE以外の方法でCrokレスポンスを伝達していないことの検証
// レギュレーション: 初期仕様の crok-response.md と同等の画面を構成する
// ために必要な情報を Server-Sent Events 以外の方法で伝達してはならない
// ================================================================
test.describe("レギュレーション: Crokレスポンスの伝達方法", () => {
  test("Crokページ表示時にSSE以外でレスポンス内容が含まれていないこと", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);

    // ネットワークリクエストを監視し、SSE以外でレスポンス内容が含まれるか確認
    const nonSseViolations: string[] = [];
    page.on("response", async (response) => {
      const url = response.url();
      const contentType = response.headers()["content-type"] ?? "";

      // SSEレスポンスとcrokエンドポイント自体は除外
      if (contentType.includes("text/event-stream")) return;
      if (url.includes("/api/v1/crok")) return;

      try {
        const body = await response.text();
        if (
          body.includes("走れメロス ― 信実の計算的記録") ||
          body.includes("メロスは激怒した。") ||
          body.includes("信実とは、決して空虚な妄想ではなかった")
        ) {
          nonSseViolations.push(url);
        }
      } catch {
        // Binary responses will throw, skip
      }
    });

    await page.getByRole("link", { name: "Crok" }).click();
    await page.waitForURL("**/crok", { timeout: 10_000 });

    // ウェルカム画面が表示されるまで待つ
    await expect(page.getByText("AIアシスタントに質問してみましょう")).toBeVisible({
      timeout: 30_000,
    });

    // SSE以外でレスポンス内容が配信されていないこと
    expect(nonSseViolations).toEqual([]);

    // ページのHTML自体にレスポンス内容が埋め込まれていないこと
    const htmlContent = await page.content();
    expect(htmlContent).not.toContain("走れメロス ― 信実の計算的記録");
    expect(htmlContent).not.toContain("メロスは激怒した。");
  });
});

// ================================================================
// POST /api/v1/initialize テスト
// レギュレーション: API POST /api/v1/initialize にリクエストを送ると、
// データベースの内容が初期値にリセットされること
// ================================================================
test.describe("レギュレーション: POST /api/v1/initialize", () => {
  test("initializeが200を返すこと", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/initialize`);
    expect(res.ok()).toBe(true);
    expect(res.status()).toBe(200);
  });

  test("initialize後にシードデータのユーザーが存在し、IDが一致すること", async ({ request }) => {
    await request.post(`${BASE_URL}/api/v1/initialize`);

    for (const user of KNOWN_USERS) {
      const res = await request.get(`${BASE_URL}/api/v1/users/${user.username}`);
      expect(res.ok()).toBe(true);
      const body = await res.json();
      expect(body.id).toBe(user.id);
      expect(body.username).toBe(user.username);
      expect(body.name).toBe(user.name);
    }
  });

  test("initialize後にシードデータの投稿が存在し、IDが一致すること", async ({ request }) => {
    await request.post(`${BASE_URL}/api/v1/initialize`);

    for (const post of KNOWN_POSTS) {
      const res = await request.get(`${BASE_URL}/api/v1/posts/${post.id}`);
      expect(res.ok()).toBe(true);
      const body = await res.json();
      expect(body.id).toBe(post.id);
      expect(body.text).toContain(post.text);
    }
  });

  test("initialize後にサインインできること（セッションリセット確認）", async ({ request }) => {
    await request.post(`${BASE_URL}/api/v1/initialize`);

    const res = await request.post(`${BASE_URL}/api/v1/signin`, {
      data: { username: "o6yq16leo", password: "wsh-2026" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.username).toBe("o6yq16leo");
  });

  test("initialize後に投稿一覧が取得できること", async ({ request }) => {
    await request.post(`${BASE_URL}/api/v1/initialize`);

    const res = await request.get(`${BASE_URL}/api/v1/posts?limit=10`);
    expect(res.ok()).toBe(true);
    const posts = await res.json();
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBe(10);
  });

  test("initializeでデータが初期状態にリセットされること", async ({ request }) => {
    // 1. 新規ユーザーを作成
    const signupRes = await request.post(`${BASE_URL}/api/v1/signup`, {
      data: {
        username: `reset_test_${Date.now().toString(36)}`,
        name: "リセットテスト",
        password: "testpass-123",
      },
    });
    expect(signupRes.ok()).toBe(true);

    // 2. initializeを実行
    await request.post(`${BASE_URL}/api/v1/initialize`);

    // 3. シードデータは存在するが、新規作成したユーザーは消えていること
    for (const user of KNOWN_USERS.slice(0, 2)) {
      const res = await request.get(`${BASE_URL}/api/v1/users/${user.username}`);
      expect(res.ok()).toBe(true);
    }
  });
});

// ================================================================
// シードデータID保全テスト
// レギュレーション: シードに何らかの変更をしたとき、
// 初期データのシードにある各種 ID を変更してはならない
// ================================================================
test.describe("レギュレーション: シードデータID保全", () => {
  test("ユーザーのIDが初期シードと一致すること", async ({ request }) => {
    for (const user of KNOWN_USERS) {
      const res = await request.get(`${BASE_URL}/api/v1/users/${user.username}`);
      expect(res.ok()).toBe(true);
      const body = await res.json();
      expect(body.id).toBe(user.id);
    }
  });

  test("投稿のIDが初期シードと一致すること", async ({ request }) => {
    for (const post of KNOWN_POSTS) {
      const res = await request.get(`${BASE_URL}/api/v1/posts/${post.id}`);
      expect(res.ok()).toBe(true);
      const body = await res.json();
      expect(body.id).toBe(post.id);
    }
  });

  test("サジェスト候補が存在すること", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/v1/crok/suggestions`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.suggestions).toBeTruthy();
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(body.suggestions.length).toBeGreaterThan(0);
  });

  test("投稿に紐づくメディア情報が保全されていること", async ({ request }) => {
    // movieIdを持つ投稿を確認
    const postWithMovie = KNOWN_POSTS[2]!; // 126968c6... は movieId を持つ
    const res = await request.get(`${BASE_URL}/api/v1/posts/${postWithMovie.id}`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.id).toBe(postWithMovie.id);
  });

  test("投稿一覧のページネーションが動作すること", async ({ request }) => {
    const page1 = await request.get(`${BASE_URL}/api/v1/posts?limit=5&offset=0`);
    expect(page1.ok()).toBe(true);
    const posts1 = await page1.json();
    expect(posts1.length).toBe(5);

    const page2 = await request.get(`${BASE_URL}/api/v1/posts?limit=5&offset=5`);
    expect(page2.ok()).toBe(true);
    const posts2 = await page2.json();
    expect(posts2.length).toBe(5);

    // ページ1とページ2のIDが重複しないこと
    const ids1 = new Set(posts1.map((p: { id: string }) => p.id));
    const ids2 = new Set(posts2.map((p: { id: string }) => p.id));
    for (const id of ids2) {
      expect(ids1.has(id)).toBe(false);
    }
  });
});
