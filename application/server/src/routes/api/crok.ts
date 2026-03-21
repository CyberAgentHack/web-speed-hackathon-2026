import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");
let suggestionQuestionsPromise: Promise<string[]> | null = null;

async function loadSuggestionQuestions(): Promise<string[]> {
  if (suggestionQuestionsPromise == null) {
    suggestionQuestionsPromise = QaSuggestion.findAll({
      attributes: ["question"],
      logging: false,
    }).then((suggestions) => suggestions.map((suggestion) => suggestion.question));
  }

  return suggestionQuestionsPromise;
}

function normalizeSuggestionText(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreSuggestion(question: string, query: string): number {
  const normalizedQuestion = normalizeSuggestionText(question);
  const normalizedQuery = normalizeSuggestionText(query);
  if (normalizedQuery === "") {
    return 0;
  }

  const compactQuestion = normalizedQuestion.replace(/\s+/g, "");
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  let score = 0;

  if (normalizedQuestion === normalizedQuery) {
    score += 1_000;
  }
  if (normalizedQuestion.startsWith(normalizedQuery)) {
    score += 500;
  }
  if (compactQuestion.includes(compactQuery)) {
    score += 200 + compactQuery.length;
  }

  const queryTerms = normalizedQuery.split(/[\s\u3000、。,.!?！？/\\-]+/u).filter(Boolean);
  for (const term of queryTerms) {
    if (compactQuestion.includes(term.replace(/\s+/g, ""))) {
      score += term.length * 10;
    }
  }

  if (score === 0) {
    const queryChars = new Set(compactQuery);
    let overlap = 0;
    for (const char of new Set(compactQuestion)) {
      if (queryChars.has(char)) {
        overlap += 1;
      }
    }
    score += overlap;
  }

  return score;
}

crokRouter.get("/crok/suggestions", async (req, res) => {
  const suggestions = await loadSuggestionQuestions();
  const rawQuery = req.query["q"];
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";

  if (query === "") {
    res.json({ suggestions });
    return;
  }

  const rankedSuggestions = suggestions
    .map((question, index) => ({
      index,
      question,
      score: scoreSuggestion(question, query),
    }))
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }
      return left.index - right.index;
    })
    .slice(0, 10)
    .map((suggestion) => suggestion.question);

  res.json({ suggestions: rankedSuggestions });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STREAM_CHUNK_SIZE = 48;
const STREAM_INTERVAL_MS = 16;

crokRouter.get("/crok", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let messageId = 0;
  for (let index = 0; index < response.length; index += STREAM_CHUNK_SIZE) {
    if (res.closed) break;

    const chunk = response.slice(index, index + STREAM_CHUNK_SIZE);
    const data = JSON.stringify({ text: chunk, done: false });
    res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);

    if (index + STREAM_CHUNK_SIZE < response.length) {
      await sleep(STREAM_INTERVAL_MS);
    }
  }

  if (!res.closed) {
    const data = JSON.stringify({ text: "", done: true });
    res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
  }

  res.end();
});
