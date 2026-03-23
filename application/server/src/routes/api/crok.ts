import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Router } from "express";
import httpErrors from "http-errors";
import { BM25 } from "bayesian-bm25";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import {
    extractContentTokens,
    getKuromojiTokenizer,
} from "@web-speed-hackathon-2026/server/src/utils/kuromoji_tokenizer";

export const crokRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(
    path.join(__dirname, "crok-response.md"),
    "utf-8",
);

crokRouter.get("/crok/suggestions", async (req, res) => {
    const suggestions = await QaSuggestion.findAll({ logging: false });
    const allSuggestions = suggestions.map((suggestion) => suggestion.question);

    const rawQuery = req.query["q"];
    const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
    if (query === "") {
        res.json({ suggestions: allSuggestions, queryTokens: [] });
        return;
    }

    const tokenizer = await getKuromojiTokenizer();
    const queryTokens = extractContentTokens(tokenizer.tokenize(query));

    if (queryTokens.length === 0) {
        res.json({ suggestions: [], queryTokens: [] });
        return;
    }

    const bm25 = new BM25({ k1: 1.2, b: 0.75 });

    const tokenizedCandidates = allSuggestions.map((suggestion) =>
        extractContentTokens(tokenizer.tokenize(suggestion)),
    );
    bm25.index(tokenizedCandidates);

    const scores = bm25.getScores(queryTokens);
    const scored = allSuggestions
        .map((suggestion, index) => ({
            suggestion,
            score: scores[index] ?? 0,
            index,
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => {
            if (a.score === b.score) {
                return a.index - b.index;
            }
            return a.score - b.score;
        })
        .slice(-10)
        .map((item) => item.suggestion);

    res.json({ suggestions: scored, queryTokens });
});

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

crokRouter.get("/crok", async (req, res) => {
    if (req.session.userId === undefined) {
        throw new httpErrors.Unauthorized();
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let messageId = 0;

    // TTFT (Time to First Token)
    await sleep(3000);

    for (const char of response) {
        if (res.closed) break;

        const data = JSON.stringify({ text: char, done: false });
        res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);

        await sleep(10);
    }

    if (!res.closed) {
        const data = JSON.stringify({ text: "", done: true });
        res.write(`event: message\nid: ${messageId}\ndata: ${data}\n\n`);
    }

    res.end();
});
