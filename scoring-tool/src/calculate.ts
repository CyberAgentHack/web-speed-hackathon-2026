import { setTimeout } from "node:timers/promises";

import mergeErrorCause from "merge-error-cause";
import type * as playwright from "playwright";
import type * as puppeteer from "puppeteer";

import { consola } from "./consola";
import type { MetricScoreBreakdown, Result, TargetCategory } from "./result";
import { calculateCrokChatFlowAction } from "./scoring/calculate_crok_chat_flow_action";
import { calculateDmChatFlowAction } from "./scoring/calculate_dm_chat_flow_action";
import { calculateDmListPage } from "./scoring/calculate_dm_list_page";
import { calculateDmPage } from "./scoring/calculate_dm_page";
import { calculateHomePage } from "./scoring/calculate_home_page";
import { calculatePostAudioPage } from "./scoring/calculate_post_audio_page";
import { calculatePostFlowAction } from "./scoring/calculate_post_flow_action";
import { calculatePostPage } from "./scoring/calculate_post_page";
import { calculatePostPhotoPage } from "./scoring/calculate_post_photo_page";
import { calculatePostVideoPage } from "./scoring/calculate_post_video_page";
import { calculateSearchPage } from "./scoring/calculate_search_page";
import { calculateSearchPostFlowAction } from "./scoring/calculate_search_post_flow_action";
import { calculateTermsPage } from "./scoring/calculate_terms_page";
import { calculateUserAuthFlowAction } from "./scoring/calculate_user_auth_flow_action";
import { createPage } from "./utils/create_page";

type Target = {
  category: TargetCategory;
  device: Partial<(typeof playwright.devices)[string]>;
  func: (params: {
    baseUrl: string;
    playwrightPage: playwright.Page;
    puppeteerPage: puppeteer.Page;
  }) => Promise<{ breakdown: MetricScoreBreakdown[]; scoreX100: number }>;
  maxScore: number;
  name: string;
};

const DEVICE = {
  deviceScaleFactor: 1,
  hasTouch: false,
  isMobile: false,
  viewport: {
    height: 1080,
    width: 1920,
  },
};

const LANDING_SCORE_THRESHOLD = 300;

const LANDING_TARGET_LIST: Target[] = [
  {
    category: "standard",
    device: DEVICE,
    func: calculateHomePage,
    maxScore: 100,
    name: "ホームを開く",
  },
  {
    category: "standard",
    device: DEVICE,
    func: calculatePostPage,
    maxScore: 100,
    name: "投稿詳細ページを開く",
  },
  {
    category: "standard",
    device: DEVICE,
    func: calculatePostPhotoPage,
    maxScore: 100,
    name: "写真つき投稿詳細ページを開く",
  },
  {
    category: "standard",
    device: DEVICE,
    func: calculatePostVideoPage,
    maxScore: 100,
    name: "動画つき投稿詳細ページを開く",
  },
  {
    category: "standard",
    device: DEVICE,
    func: calculatePostAudioPage,
    maxScore: 100,
    name: "音声つき投稿詳細ページを開く",
  },
  {
    category: "standard",
    device: DEVICE,
    func: calculateSearchPage,
    maxScore: 100,
    name: "検索ページを開く",
  },
  {
    category: "standard",
    device: DEVICE,
    func: calculateDmListPage,
    maxScore: 100,
    name: "DM一覧ページを開く",
  },
  {
    category: "standard",
    device: DEVICE,
    func: calculateDmPage,
    maxScore: 100,
    name: "DM詳細ページを開く",
  },
  {
    category: "standard",
    device: DEVICE,
    func: calculateTermsPage,
    maxScore: 100,
    name: "利用規約ページを開く",
  },
];

const USER_FLOW_TARGET_LIST: Target[] = [
  {
    category: "userFlow",
    device: DEVICE,
    func: calculateUserAuthFlowAction,
    maxScore: 50,
    name: "ユーザーフロー: ユーザー登録 → サインアウト → サインイン",
  },
  {
    category: "userFlow",
    device: DEVICE,
    func: calculateDmChatFlowAction,
    maxScore: 50,
    name: "ユーザーフロー: DM送信",
  },
  {
    category: "userFlow",
    device: DEVICE,
    func: calculateSearchPostFlowAction,
    maxScore: 50,
    name: "ユーザーフロー: 検索 → 結果表示",
  },
  {
    category: "userFlow",
    device: DEVICE,
    func: calculateCrokChatFlowAction,
    maxScore: 50,
    name: "ユーザーフロー: Crok AIチャット",
  },
  {
    category: "userFlow",
    device: DEVICE,
    func: calculatePostFlowAction,
    maxScore: 50,
    name: "ユーザーフロー: 投稿",
  },
];

const ALL_TARGET_LIST = [...LANDING_TARGET_LIST, ...USER_FLOW_TARGET_LIST];
export const TARGET_NAME_LIST = ALL_TARGET_LIST.map(({ name }) => name);

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

type Params = {
  baseUrl: string;
  targetName?: string;
};

async function* _calculate({
  baseUrl,
  targets,
}: {
  baseUrl: string;
  targets: Target[];
}): AsyncGenerator<Result, void, void> {
  for (const target of targets) {
    await using context = await createPage({
      device: target.device,
    });

    try {
      const { playwrightPage, puppeteerPage } = context;
      const { breakdown, scoreX100 } = await target.func({
        baseUrl,
        playwrightPage,
        puppeteerPage,
      });
      yield { breakdown, scoreX100, target };
    } catch (err) {
      consola.error(mergeErrorCause(err));
      yield { breakdown: [], error: err as Error, scoreX100: 0, target };
    }

    // サーバー負荷が落ち着くまで、10秒待つ
    await setTimeout(10 * 1000);
  }
}

export async function* calculate({
  baseUrl,
  targetName,
}: Params): AsyncGenerator<Result, void, void> {
  if (targetName != null) {
    const targets = ALL_TARGET_LIST.filter(({ name }) =>
      name.includes(targetName)
    );
    if (targets.length === 0) {
      throw new Error(`指定された計測名 \`${targetName}\` は存在しません`);
    }
    for await (const result of _calculate({ baseUrl, targets })) {
      yield result;
    }
    return;
  }

  const landingResults = [];

  for await (
    const result of _calculate({
      baseUrl,
      targets: LANDING_TARGET_LIST,
    })
  ) {
    landingResults.push(result);
    yield result;
  }

  const landingTotalScore = round(
    landingResults.reduce((sum, { scoreX100 }) => sum + scoreX100, 0) / 100,
    2,
  );

  if (landingTotalScore < LANDING_SCORE_THRESHOLD) {
    for (const target of USER_FLOW_TARGET_LIST) {
      yield {
        breakdown: [],
        error: new Error(
          `「ページの表示」が${LANDING_SCORE_THRESHOLD}点よりも低いため、残りの計測をスキップしました`,
        ),
        scoreX100: 0,
        target,
      };
    }
  } else {
    for await (
      const result of _calculate({
        baseUrl,
        targets: USER_FLOW_TARGET_LIST,
      })
    ) {
      yield result;
    }
  }
}
