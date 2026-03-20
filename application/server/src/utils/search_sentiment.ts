const NEGATIVE_KEYWORDS = [
  "つらい",
  "辛い",
  "しんどい",
  "苦しい",
  "悲しい",
  "最悪",
  "嫌",
  "いや",
  "無理",
  "疲れた",
  "落ち込",
  "死にたい",
  "消えたい",
  "不安",
  "憂鬱",
];

export function isNegativeSearchQuery(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (normalized === "") {
    return false;
  }

  return NEGATIVE_KEYWORDS.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

