import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";

// Single Hono app instance shared across the application
export const honoApp = new Hono();

// WebSocket support
export const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app: honoApp });
