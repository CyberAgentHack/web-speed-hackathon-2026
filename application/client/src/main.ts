import "./buildinfo";
import "./index.css";
import { preloadRouteData } from "@web-speed-hackathon-2026/client/src/utils/route_preload";

preloadRouteData(window.location.pathname);

void import("./index");
