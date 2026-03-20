import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "../server/openapi.yaml",
    output: {
      mode: "tags-split",
      target: "./src/api/generated",
      schemas: "./src/api/generated/model",
      client: "react-query",
      httpClient: "fetch",
      override: {
        query: {
          version: 5,
        },
        mutator: {
          path: "./src/api/orval-mutator.ts",
          name: "orvalFetcher",
        },
      },
    },
  },
});
