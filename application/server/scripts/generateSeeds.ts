import { createWriteStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { faker } from "@faker-js/faker/locale/ja";

// Set seed for reproducible results
faker.seed(123);

import type {
  CommentSeed,
  DirectMessageConversationSeed,
  DirectMessageSeed,
  ImageSeed,
  MovieSeed,
  PostSeed,
  PostsImagesRelationSeed,
  ProfileImageSeed,
  SoundSeed,
  UserSeed,
} from "../src/types/seed";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedsDir = path.resolve(__dirname, "../seeds");

// ========== Existing Asset IDs from public directory ==========
// These IDs correspond to actual files in the public directory

// public/images/*.jpg (30 files) - with alt text from EXIF ImageDescription
const EXISTING_IMAGES = [
  { id: "029b4b75-bbcc-4aa5-8bd7-e4bb12a33cd3", alt: "海岸沿いにある大きな岩の上に水着の女性が座っている" },
  { id: "078c4d42-12e3-4c1d-823c-9ba552f6b066", alt: "枯れた木々に雪が積もっている森林を自動車道が通っていて日が差している" },
  { id: "083258be-3e8c-4537-ac9c-fd5fd9cd943b", alt: "黒い布で頭を覆う女性がスマートフォンで自撮りをしている" },
  { id: "18358ca6-0aa7-4592-9926-1ec522b9aacb", alt: "高いところから大都市のビルや車が光る夜景を眺めている" },
  { id: "19b3516f-ccfc-4d76-a45c-fc2aade43afe", alt: "黒い車の斜め前方を接写している" },
  { id: "26117ade-f330-46a2-8c48-767b6f472613", alt: "ジャングルの中で２人の女性が大きい葉の裏から顔を覗かせている" },
  { id: "3a5915dc-6ef0-4c66-ad4b-bba9c724cfbc", alt: "雪の降る中で街灯の頭に雪が積もっている" },
  { id: "4685b32a-43d2-4478-bb79-2cdb56f8ecf0", alt: "暗がりのなか緑色の縁を持つ窓に光が照らされている" },
  { id: "49b8af97-9536-4a23-86f6-21526ff2715b", alt: "峡谷のなかを大きな道路があり車が１台走っている" },
  { id: "5be3fce7-0365-4aa3-a1b6-cdeb553e8dfb", alt: "コードを書いている最中のデスクにワイヤレスイヤホンがある" },
  { id: "5e7212da-6b4c-4eb2-b828-b0bc35bfbc1c", alt: "雪の降る森を空から俯瞰している" },
  { id: "6d532fa5-daff-4876-a26f-b5c8669d1176", alt: "４枚の異なる柄のセーターが畳まれて積まれている" },
  { id: "737f764e-f495-4104-b6d6-8434681718d5", alt: "薄暗い空間で踊る女性が赤く照らされている" },
  { id: "77284ba9-06c0-4c66-92a9-4d2513336e24", alt: "砂漠のなかで女性が遠くを見つめる" },
  { id: "824ddc65-8afc-4cd5-8176-1a8053758e72", alt: "ミュージアムの看板が隣接する川に反射している" },
  { id: "85946f86-c0bd-4d6b-83b7-94eb32dcbcf4", alt: "砂糖で白くコーティングされたうえにキャラメルが線状にかかっているドーナッツ" },
  { id: "9bb2f5c0-0f7c-4b9d-8e6a-aa87ebe7efc5", alt: "無機質な壁に小窓があり斜め格子状に木の板が貼られている" },
  { id: "9c8c5258-f659-4890-8b7f-0485097d957b", alt: "広大な草原の中央に礼服を着た男性と白いドレスを着た女性が立っている" },
  { id: "a21c9b2c-9fc7-4d3c-8488-a465150f7b1c", alt: "横たわる長髪の男性を目を閉じた女性がかかえている" },
  { id: "af15685e-2e43-4453-bc8f-55e386bd5963", alt: "サングラスを掛けた男性が草むらの中央で格好をつけている" },
  { id: "af15f1d0-8350-46f4-9652-e02eb31469da", alt: "白で統一された建築物が立ち並ぶ一角にあるプール" },
  { id: "c095fdc4-eb78-4ae1-9efa-4b8e360177ce", alt: "デスクの上にスマートフォンと水筒が置かれている" },
  { id: "da2bfcde-14fd-473c-ae79-572d95152b61", alt: "幼少の少年が大きなジョウロで植物に水をやっている" },
  { id: "ddc7053e-0f2f-49b1-9c07-e1060e2fa4aa", alt: "霧で奥が見えないほどの巨大な橋が海峡にかかっている" },
  { id: "e40ff559-d0d3-4eb0-8792-21cb171b815c", alt: "一面の雪原のなかに淡い青色の湖がある" },
  { id: "eb487309-79ed-40d0-9fee-382ed8486b70", alt: "くし形に切られた大量のいちじく" },
  { id: "ec098438-5fac-44a8-bd5a-84c575a32790", alt: "茶色で照りのある革靴を履いた男性の足元" },
  { id: "ee6d7cb7-3c05-4bde-92e5-aebef3785904", alt: "古代エジプトの風貌をした男性が女性を抱きかかえている" },
  { id: "f046441d-b837-4dc7-b0ae-5cf2604eab4c", alt: "冬景色を背景に小枝に生える葉っぱを映している" },
  { id: "f478a152-02f8-46a3-91ce-d1d7944d303a", alt: "宙にオレンジ色の輪っかがペンキのようなもので描かれている" },
];

// public/movies/*.gif (15 files)
const EXISTING_MOVIE_IDS = [
  "090e7491-5cdb-4a1b-88b1-1e036a45e296",
  "0c4b66bc-091e-4f76-85a3-288567cfdc12",
  "1b558288-6ec6-4ece-a9b8-4259379b7489",
  "241b7993-f7c4-49e5-84f0-bbaf6a144634",
  "3cb50e48-535b-4e5f-bbde-455c01def021",
  "51a14d70-9dd6-45ad-9f87-64af91ec2779",
  "6ccc437c-253d-4e6f-baa2-2f4f2419f830",
  "74eb4b82-601d-40ec-9aa5-70c4ac5d9799",
  "7518b1ae-3bc5-4b42-b82b-0013a3a74b16",
  "826f0b4d-0f4b-408c-9560-a82798116255",
  "b3998a47-ee87-483e-acf1-8e5b69c8527a",
  "b44e6ef6-fb30-4f59-9c86-70fe0f1edf08",
  "c8f1d48d-d831-4d69-9477-0112152f95b9",
  "db504945-d122-4c70-8c2d-fe636282ca00",
  "fafa6ec6-1572-4def-aa16-4a9fbf28aa41",
];

// public/sounds/*.mp3 (15 files) - with title/artist info
const EXISTING_SOUNDS = [
  { id: "05333292-5786-4a1f-9046-6b4863da3286", title: "Whispered Echoes", artist: "Luna Park" },
  { id: "10b3358c-945f-428e-a7f1-1558f675ef3d", title: "Be Jammin", artist: "Mariah Decicco" },
  { id: "2174b434-fe47-4c6a-9f30-de4d4e4c7554", title: "BeBop for Joey", artist: "Ashely Matsuo" },
  { id: "28604fdc-0adb-40b0-bd67-ed39d61f007d", title: "Ocean Dreams", artist: "Wave Riders" },
  {
    id: "2abadebb-6fae-4db0-9dba-d3063d9cc2e1",
    title: "New Hero in Town",
    artist: "Henrietta Almeida",
  },
  { id: "42232f2b-b7b2-46f8-a3de-1eefbfbbd8c2", title: "Hold on a Sec", artist: "Alexa Hillard" },
  { id: "49a3663a-1e66-4e22-83b8-3c43f181a254", title: "Marked", artist: "Earlene Apicella" },
  { id: "4ce92862-3d2d-47a4-975d-4b293173cec4", title: "Stunted Adventure", artist: "Rod Zepp" },
  {
    id: "5352a4a1-6a47-445d-874d-6e08f811c4f4",
    title: "Bavarian Seascape",
    artist: "Nyla Eriksson",
  },
  {
    id: "56570f22-2db4-458c-981d-558021d2f648",
    title: "Adventures of Flying Jack",
    artist: "Dessie Riffe",
  },
  { id: "5a93be41-caab-4eec-9ac1-8b57c24ccbe2", title: "Coy Koi", artist: "Minnie Sweeny" },
  { id: "5d0cd8a0-805a-4fb8-940a-53d2dee9c87e", title: "Study and Relax", artist: "Gigi Mohan" },
  { id: "8bb8891c-40c1-4536-8eee-2ecdac298931", title: "Big Eyes", artist: "Jone Adam" },
  { id: "8ed91156-d15e-4a6a-87cc-87f2e8905fa3", title: "Hillbilly Swing", artist: "Nan Lykes" },
  { id: "93b848fe-24c8-4597-a515-463a910f6ceb", title: "Midnight Jazz", artist: "Blue Note" },
];

// public/images/profiles/*.jpg (30 files)
const EXISTING_PROFILE_IMAGE_IDS = [
  "09d52cbb-28a2-4413-b220-1f8c9e80a440",
  "0aba06a6-1b56-4ebd-8218-951aaba173af",
  "0ccabdd2-4601-4c2f-88f5-1848b06ef035",
  "25dde9ae-1dd3-4d23-bfd3-90a94b59816c",
  "2d5ef610-a9e5-426c-9eeb-916a9b753d55",
  "36079dc7-dd73-4073-aceb-7d5c1f0dab4e",
  "37812068-9ef8-4429-b219-8d9c9b91c89c",
  "396fe4ce-aa36-4d96-b54e-6db40bae2eed",
  "3d43c4e2-6eaf-4bb9-bff3-cb955440c891",
  "3dd3640a-5f9e-40d0-8daf-bfdb473b129e",
  "51874337-0b42-4b03-8e3d-fbd4960a9947",
  "52c82d1c-b455-4572-aef1-0dd61b50b1d2",
  "538dbca6-85d6-434e-a1f4-b370d03dbb85",
  "5506d25e-f03b-497a-a883-6434aa160d0f",
  "5e071af0-e9a1-4c5c-859f-464c18bb7da9",
  "6931b54d-f07b-405d-80dc-17c09acebfa9",
  "7d7bf516-e05e-4a4f-95fa-0c73e7bd3f93",
  "84ba6fee-d167-43c4-8b10-d94caa923f48",
  "a99e1112-f0a0-46a3-8e23-5d34c27898c0",
  "af98cd5f-b1a6-408c-a455-0970b3247e4c",
  "b2c256a3-296f-49e0-ba8b-101b55146956",
  "c8939885-5dca-4132-b234-64a12c1861a5",
  "ca81e02a-11aa-4218-971d-c8bd8d9e67cf",
  "cd5b31e5-0fb4-4b40-830d-3a22058b30cc",
  "cf145991-b2ff-4ef5-aeb5-dbc9d9eb51a0",
  "dbe9b1f0-9822-4f77-9635-f9fd64e2b4e5",
  "ed0d327c-2ba5-4b23-8284-3e31f7a51d16",
  "f1f4c2c2-bf06-44b5-b43e-02a00d770242",
  "f4619909-0f90-45dd-ada0-6c6305453a74",
  "fd571d42-c471-47fd-846f-d3c1325685fd",
];

const CONFIG = {
  USER_COUNT: 100,
  POST_COUNT: 3000,
  COMMENTS_PER_POST: 30,
  IMAGES_PER_POST_MAX: 4,
  // Post media type ratios (should sum to <= 1.0)
  POST_MOVIE_RATIO: 0.3, // 30% of posts have movies
  POST_SOUND_RATIO: 0.2, // 20% of posts have sounds
  // Remaining ~50% will have images (or nothing if unlucky with random image selection)
};

// 再生成しても同じデータになるように、日時を固定する
const now = new Date("2026-02-01T00:00:00Z").getTime();

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function randomDateWithinWeek(): Date {
  return new Date(now - faker.number.int({ min: 0, max: ONE_WEEK_MS }));
}

function randomDateAfter(afterDate: Date): Date {
  const afterMs = afterDate.getTime();
  const remainingMs = now - afterMs;
  return new Date(afterMs + faker.number.int({ min: 0, max: remainingMs }));
}

function pickRandom<T>(arr: T[]): T {
  return faker.helpers.arrayElement(arr);
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  return faker.helpers.arrayElements(arr, n);
}

function generateProfileImages(): ProfileImageSeed[] {
  // Use existing profile image IDs from public/images/profiles/
  return EXISTING_PROFILE_IMAGE_IDS.map((id) => ({
    id,
    alt: "",
  }));
}

function generateUsers(count: number, profileImages: ProfileImageSeed[]): UserSeed[] {
  const users: UserSeed[] = [];
  const usedUsernames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let username: string;
    do {
      username = faker.internet
        .username()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    } while (usedUsernames.has(username) || username.length < 3);
    usedUsernames.add(username);

    const profileImage = profileImages[i % profileImages.length];
    const createdAt = randomDateWithinWeek();

    users.push({
      id: faker.string.uuid(),
      username,
      name: faker.person.fullName(),
      description: faker.lorem.sentence(),
      password: "wsh-2026",
      profileImageId: profileImage.id,
      createdAt: createdAt.toISOString(),
    });
  }

  return users;
}

function generateImages(): ImageSeed[] {
  // Use existing image IDs from public/images/
  const baseTime = now - ONE_WEEK_MS;
  return EXISTING_IMAGES.map((image, i) => ({
    id: image.id,
    alt: image.alt,
    createdAt: new Date(baseTime + i * 60 * 1000).toISOString(),
  }));
}

function generateMovies(): MovieSeed[] {
  // Use existing movie IDs from public/movies/
  return EXISTING_MOVIE_IDS.map((id) => ({
    id,
  }));
}

function generateSounds(): SoundSeed[] {
  // Use existing sound data from public/sounds/
  return EXISTING_SOUNDS.map(({ id, title, artist }) => ({
    id,
    title,
    artist,
  }));
}

const postTemplates = [
  "今日もいい天気だね！",
  "最近カメラにハマっていて、色々な日常風景を撮影してる",
  "旅行に行ってきました！景色がキレイで楽しかった",
  "親からこの写真送られてきたんだけど、どういう意味なんだろう...",
  "昔はここまで綺麗な写真をスマホで撮れなかったよ、スマホのカメラもすごいなぁ",
  "写真に残すと記憶にも残りやすいよね、自分の人生で印象強い写真はこれ",
  "写真でボケて！お題の写真はこちら、解答お待ちしてます！",
  "謎解きの問題なんだけど、写真から読み取れる情報が多すぎて難しい",
  "このカメラマンの写真がすごく美しい、感動してる",
  "このアニメ、タイトルなんだっけ...懐かしい気がするんだけど...",
  "今日はこの曲でリラックス、疲れが癒される",
  "新しい趣味を見つけたい...",
  "今日のランチは最高だった",
  "週末の予定を考え中",
  "おすすめの本があったら教えてください！",
];

function generatePosts(
  count: number,
  users: UserSeed[],
  movies: MovieSeed[],
  sounds: SoundSeed[],
): PostSeed[] {
  const posts: PostSeed[] = [];

  for (let i = 0; i < count; i++) {
    const user = pickRandom(users);
    const createdAt = randomDateWithinWeek();

    const rand = faker.number.float({ min: 0, max: 1, fractionDigits: 2 });
    const hasMovie = rand < CONFIG.POST_MOVIE_RATIO;
    const hasSound = !hasMovie && rand < CONFIG.POST_MOVIE_RATIO + CONFIG.POST_SOUND_RATIO;

    const post: PostSeed = {
      id: faker.string.uuid(),
      userId: user.id,
      text: pickRandom(postTemplates),
      createdAt: createdAt.toISOString(),
    };

    if (hasMovie) {
      post.movieId = pickRandom(movies).id;
    }
    if (hasSound) {
      post.soundId = pickRandom(sounds).id;
    }

    posts.push(post);
  }

  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function generatePostsImagesRelation(
  posts: PostSeed[],
  images: ImageSeed[],
): PostsImagesRelationSeed[] {
  const relations: PostsImagesRelationSeed[] = [];

  for (const post of posts) {
    if (post.movieId || post.soundId) continue;

    const imageCount = faker.number.int({ min: 0, max: CONFIG.IMAGES_PER_POST_MAX });
    if (imageCount === 0) continue;

    const selectedImages = pickRandomN(images, imageCount);
    for (const image of selectedImages) {
      relations.push({
        postId: post.id,
        imageId: image.id,
      });
    }
  }

  return relations;
}

const commentTemplates = [
  "とてもいいですね、自分好みです",
  "最近はこういう感じなんですね、勉強になります",
  "そういうこと考えたことなかった、すごいですね！",
  "自分も同じ経験があって、共感できました！",
  "それは深く考えすぎだよ、もっと気楽に",
  "わたしも同じこと考えてました！",
  "素敵な投稿をありがとう！",
  "なるほど、参考になりました",
  "面白い視点ですね！",
  "共感しかない",
];

function generateComments(
  posts: PostSeed[],
  users: UserSeed[],
  commentsPerPost: number,
): CommentSeed[] {
  const comments: CommentSeed[] = [];

  for (const post of posts) {
    const postCreatedAt = new Date(post.createdAt);
    const commentCount = faker.number.int({ min: 1, max: commentsPerPost });

    for (let i = 0; i < commentCount; i++) {
      const user = pickRandom(users);
      const createdAt = randomDateAfter(postCreatedAt);

      comments.push({
        id: faker.string.uuid(),
        userId: user.id,
        postId: post.id,
        text: pickRandom(commentTemplates),
        createdAt: createdAt.toISOString(),
      });
    }
  }

  return comments;
}

const WEEK_START = now - ONE_WEEK_MS;
const DM_MIN_MESSAGE_GAP_MS = 60 * 1000;

const dmTemplates = [
  "おつかれさま！\nこの前話してたお店、やっぱり気になってる。\n今度タイミング合う日に一緒に行かない？",
  "さっき帰ってきたよ。\n思ってたよりバタバタしてて返信遅くなっちゃった。\nまた落ち着いたらゆっくり話したい。",
  "写真見たよ、すごくいい感じだった！\n雰囲気が伝わってきて、こっちまで行きたくなった。\nまたおすすめあったら教えてほしい。",
  "今日はちょっと早めに帰れそう。\nもしまだ予定決まってなかったら、夜に少しだけ電話できる？\n無理そうならまた別の日でも大丈夫。",
  "連絡ありがとう！\n気にかけてもらえてうれしかった。\nひとまず元気にしてるから安心してね。",
  "この前の話、ずっと気になってたんだけど\n無理してないかなって少し心配してた。\n返せるタイミングで近況だけでも聞けたらうれしい。",
  "今週末の予定、だいたい見えてきたよ。\n土曜の午後なら動けそうなんだけどどうかな？\n合わなかったら日曜でも調整する。",
  "さっきおすすめしてもらったの見てみた！\n思ってた以上に好みで、つい最後まで見ちゃった。\n教えてくれてありがとう。",
  "おはよう！\n今日は少し余裕があるから、前に言ってた件を進めようと思ってる。\n急ぎじゃないけど、気になることあれば送っておいて。",
  "ごめん、昨日そのまま寝落ちしてた。\n途中で返そうと思ってたのに完全にタイミング逃した。\nまた今日のどこかで返すね。",
  "了解！\nじゃあその時間に合わせて向かうようにする。\n着きそうになったらもう一回連絡するね。",
  "最近ちょっと忙しかったけど、やっと一段落したよ。\n落ち着いたらまたごはんでも行きたい。\n来週あたり空いてる日ある？",
];

// 各ユーザーの会話相手数を決定（3〜15人、平均10人）
function determineConversationPartnersPerUser(users: UserSeed[]): Map<string, number> {
  const partnersPerUser = new Map<string, number>();
  for (const user of users) {
    const count = Math.max(3, Math.min(15, faker.number.int({ min: 7, max: 13 })));
    partnersPerUser.set(user.id, count);
  }
  return partnersPerUser;
}

// ペアを生成（グリーディアルゴリズムで各ユーザーが目標数のペアを持つように調整）
function generateConversationPairs(
  users: UserSeed[],
  partnersPerUser: Map<string, number>,
): Array<[UserSeed, UserSeed]> {
  const pairs: Array<[UserSeed, UserSeed]> = [];
  const userPairCounts = new Map<string, number>(); // 各ユーザーの現在のペア数

  // 初期化
  for (const user of users) {
    userPairCounts.set(user.id, 0);
  }

  // 目標ペア数が多い順にソート
  const sortedUsers = [...users].sort(
    (a, b) => (partnersPerUser.get(b.id) || 0) - (partnersPerUser.get(a.id) || 0),
  );

  const usedPairs = new Set<string>();

  for (const userA of sortedUsers) {
    const targetCount = partnersPerUser.get(userA.id) || 0;
    const currentCount = userPairCounts.get(userA.id) || 0;

    if (currentCount >= targetCount) continue;

    // まだペアが必要な候補を探す
    const candidates = users.filter((userB) => {
      if (userA.id === userB.id) return false;
      const pairKey = [userA.id, userB.id].sort().join(":");
      if (usedPairs.has(pairKey)) return false;

      const userBCurrent = userPairCounts.get(userB.id) || 0;
      const userBTarget = partnersPerUser.get(userB.id) || 0;
      return userBCurrent < userBTarget;
    });

    // ランダムに選択して必要数までペアを作る
    const needed = targetCount - currentCount;
    const selected = faker.helpers.arrayElements(candidates, Math.min(needed, candidates.length));

    for (const userB of selected) {
      const pairKey = [userA.id, userB.id].sort().join(":");
      usedPairs.add(pairKey);
      pairs.push([userA, userB]);

      userPairCounts.set(userA.id, (userPairCounts.get(userA.id) || 0) + 1);
      userPairCounts.set(userB.id, (userPairCounts.get(userB.id) || 0) + 1);
    }
  }

  return pairs;
}

// 各ペアのメッセージ数を決定（300〜500件）
function determineMessagesPerPair(pairCount: number): number[] {
  const counts: number[] = [];
  for (let i = 0; i < pairCount; i++) {
    counts.push(faker.number.int({ min: 300, max: 500 }));
  }
  return counts;
}

function compareMessageSeedOrder(
  a: Pick<DirectMessageSeed, "id" | "createdAt">,
  b: Pick<DirectMessageSeed, "id" | "createdAt">,
): number {
  const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }
  return a.id.localeCompare(b.id);
}

function sortMessagesByCreatedAt<T extends Pick<DirectMessageSeed, "id" | "createdAt">>(
  messages: T[],
): T[] {
  return [...messages].sort(compareMessageSeedOrder);
}

function messageCreatedAtMs(message: Pick<DirectMessageSeed, "createdAt">): number {
  return new Date(message.createdAt).getTime();
}

function splitDurationIntoRandomGaps(segmentCount: number, totalDurationMs: number): number[] {
  if (segmentCount === 0) {
    return [];
  }

  const minimumDurationMs = segmentCount * DM_MIN_MESSAGE_GAP_MS;
  if (totalDurationMs < minimumDurationMs) {
    throw new Error(
      "totalDurationMs must be greater than or equal to minimum conversation duration",
    );
  }

  const extraDurationMs = totalDurationMs - minimumDurationMs;
  const weights = Array.from({ length: segmentCount }, () =>
    faker.number.int({ min: 1, max: 100 }),
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  let accumulatedWeight = 0;
  let previousBoundary = 0;

  return weights.map((weight, index) => {
    accumulatedWeight += weight;
    const boundary =
      index === weights.length - 1
        ? extraDurationMs
        : Math.round((extraDurationMs * accumulatedWeight) / totalWeight);
    const extraGapMs = boundary - previousBoundary;
    previousBoundary = boundary;

    return DM_MIN_MESSAGE_GAP_MS + extraGapMs;
  });
}

function generateConversationTimestamps(messageCount: number): Date[] {
  if (messageCount <= 0) {
    return [];
  }

  const minimumConversationDurationMs = (messageCount - 1) * DM_MIN_MESSAGE_GAP_MS;
  const latestMessageAtMs = faker.number.int({
    min: WEEK_START + minimumConversationDurationMs,
    max: now - 1,
  });

  if (messageCount === 1) {
    return [new Date(latestMessageAtMs)];
  }

  const totalConversationDurationMs = faker.number.int({
    min: minimumConversationDurationMs,
    max: latestMessageAtMs - WEEK_START,
  });
  const gaps = splitDurationIntoRandomGaps(messageCount - 1, totalConversationDurationMs);

  const timestamps = [latestMessageAtMs];
  let currentTime = latestMessageAtMs;

  for (const gap of gaps) {
    currentTime -= gap;
    timestamps.push(currentTime);
  }

  return timestamps.reverse().map((timestamp) => new Date(timestamp));
}

// 各ペアで会話を生成（送信者が交互に変わる）
function generateConversationForPair(
  userA: UserSeed,
  userB: UserSeed,
  conversationId: string,
  messageCount: number,
): Omit<DirectMessageSeed, "isRead">[] {
  const messages: Omit<DirectMessageSeed, "isRead">[] = [];
  const timestamps = generateConversationTimestamps(messageCount);
  let currentSender = faker.datatype.boolean() ? userA : userB; // ランダムに開始者決定

  for (const createdAt of timestamps) {
    messages.push({
      id: faker.string.uuid(),
      conversationId,
      senderId: currentSender.id,
      body: pickRandom(dmTemplates),
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });

    // 85%の確率で送信者を交代
    if (faker.datatype.boolean({ probability: 0.85 })) {
      currentSender = currentSender === userA ? userB : userA;
    }
  }

  return messages;
}

interface DirectMessageGenerationResult {
  conversations: DirectMessageConversationSeed[];
  messages: DirectMessageSeed[];
}

function determineLastReadAtForUser(
  conversation: Omit<DirectMessageSeed, "isRead">[],
  activeUserId: string,
): string | null {
  const sortedConversation = sortMessagesByCreatedAt(conversation);
  const sentMessages = sortedConversation.filter((message) => message.senderId === activeUserId);
  const receivedMessages = sortedConversation.filter(
    (message) => message.senderId !== activeUserId,
  );

  if (receivedMessages.length === 0) {
    return null;
  }

  const latestReceivedMessage = receivedMessages[receivedMessages.length - 1];
  const latestSentMessage = sentMessages[sentMessages.length - 1];
  // 自分が返信しているなら、その時点までに届いていた相手メッセージは既読にしておく。
  const requiredReadMessage =
    latestSentMessage == null
      ? null
      : ([...receivedMessages]
          .reverse()
          .find(
            (message) => messageCreatedAtMs(message) <= messageCreatedAtMs(latestSentMessage),
          ) ?? null);

  const partialReadCandidates = receivedMessages.filter((message) => {
    const createdAtMs = messageCreatedAtMs(message);
    const isAfterRequiredRead =
      requiredReadMessage == null || createdAtMs >= messageCreatedAtMs(requiredReadMessage);
    const isBeforeLatestReceived = createdAtMs < messageCreatedAtMs(latestReceivedMessage);
    return isAfterRequiredRead && isBeforeLatestReceived;
  });

  const readStateRoll = faker.number.int({ min: 1, max: 100 });

  if (readStateRoll <= 55) {
    return latestReceivedMessage.createdAt;
  }

  if (readStateRoll <= 90 && partialReadCandidates.length > 0) {
    return pickRandom(partialReadCandidates).createdAt;
  }

  if (sentMessages.length === 0) {
    return null;
  }

  if (partialReadCandidates.length > 0) {
    return pickRandom(partialReadCandidates).createdAt;
  }

  return latestReceivedMessage.createdAt;
}

function generateDirectMessages(users: UserSeed[]): DirectMessageGenerationResult {
  console.log("Generating conversation pairs...");
  const partnersPerUser = determineConversationPartnersPerUser(users);
  const pairs = generateConversationPairs(users, partnersPerUser);
  const messagesPerPair = determineMessagesPerPair(pairs.length);

  console.log(`Generated ${pairs.length} conversation pairs`);

  const allConversations: DirectMessageConversationSeed[] = [];
  const allMessages: DirectMessageSeed[] = [];

  for (let i = 0; i < pairs.length; i++) {
    const [userA, userB] = pairs[i];
    const conversationId = faker.string.uuid();
    allConversations.push({ id: conversationId, initiatorId: userA.id, memberId: userB.id });

    const messageCount = messagesPerPair[i];
    const conversation = sortMessagesByCreatedAt(
      generateConversationForPair(userA, userB, conversationId, messageCount),
    );

    const lastReadAtForA = determineLastReadAtForUser(conversation, userA.id);
    const lastReadAtForB = determineLastReadAtForUser(conversation, userB.id);

    const messagesWithIsRead = conversation.map((msg) => {
      let isRead = false;
      // 受信者判定: 自分以外が送ったメッセージを相手が読んだか
      if (msg.senderId === userB.id && lastReadAtForA != null) {
        isRead = new Date(msg.createdAt).getTime() <= new Date(lastReadAtForA).getTime();
      } else if (msg.senderId === userA.id && lastReadAtForB != null) {
        isRead = new Date(msg.createdAt).getTime() <= new Date(lastReadAtForB).getTime();
      }
      return { ...msg, isRead };
    });

    allMessages.push(...messagesWithIsRead);
  }

  console.log(`Generated ${allMessages.length} total messages`);

  allMessages.sort(compareMessageSeedOrder);

  return {
    conversations: allConversations,
    messages: allMessages,
  };
}

async function writeJsonlFile<T>(filename: string, data: T[]): Promise<void> {
  const filePath = path.join(seedsDir, filename);
  const stream = createWriteStream(filePath);

  for (const item of data) {
    stream.write(JSON.stringify(item) + "\n");
  }

  await new Promise<void>((resolve, reject) => {
    stream.end((err?: Error | null) => (err ? reject(err) : resolve()));
  });
}

async function main() {
  console.log("Generating seed data...");

  console.log("1. Generating ProfileImages (using existing assets)...");
  const profileImages = generateProfileImages();

  console.log("2. Generating Users...");
  const users = generateUsers(CONFIG.USER_COUNT, profileImages);

  console.log("3. Generating Images (using existing assets)...");
  const images = generateImages();

  console.log("4. Generating Movies (using existing assets)...");
  const movies = generateMovies();

  console.log("5. Generating Sounds (using existing assets)...");
  const sounds = generateSounds();

  console.log("6. Generating Posts...");
  const posts = generatePosts(CONFIG.POST_COUNT, users, movies, sounds);

  console.log("7. Generating PostsImagesRelation...");
  const postsImagesRelation = generatePostsImagesRelation(posts, images);

  console.log("8. Generating Comments...");
  const comments = generateComments(posts, users, CONFIG.COMMENTS_PER_POST);

  console.log("9. Generating DirectMessages...");
  const { conversations: directMessageConversations, messages: directMessages } =
    generateDirectMessages(users);

  console.log("Writing seed files...");

  await Promise.all([
    writeJsonlFile("profileImages.jsonl", profileImages),
    writeJsonlFile("users.jsonl", users),
    writeJsonlFile("images.jsonl", images),
    writeJsonlFile("movies.jsonl", movies),
    writeJsonlFile("sounds.jsonl", sounds),
    writeJsonlFile("posts.jsonl", posts),
    writeJsonlFile("postsImagesRelation.jsonl", postsImagesRelation),
    writeJsonlFile("comments.jsonl", comments),
    writeJsonlFile("directMessageConversations.jsonl", directMessageConversations),
    writeJsonlFile("directMessages.jsonl", directMessages),
  ]);

  console.log("\nSeed generation complete!");
  console.log(`- ProfileImages: ${profileImages.length}`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Images: ${images.length}`);
  console.log(`- Movies: ${movies.length}`);
  console.log(`- Sounds: ${sounds.length}`);
  console.log(`- Posts: ${posts.length}`);
  console.log(`- PostsImagesRelation: ${postsImagesRelation.length}`);
  console.log(`- Comments: ${comments.length}`);
  console.log(`- DirectMessageConversations: ${directMessageConversations.length}`);
  console.log(`- DirectMessages: ${directMessages.length}`);
}

main().catch((error) => {
  console.error("Error generating seeds:", error);
  process.exit(1);
});
