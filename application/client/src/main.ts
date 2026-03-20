import $ from "jquery";
import "core-js";
import "regenerator-runtime/runtime";
import "./buildinfo";
import "./index.css";

async function bootstrap(): Promise<void> {
  const globalWindow = window as Window &
    typeof globalThis & {
      $: typeof $;
      jQuery: typeof $;
    };

  globalWindow.$ = $;
  globalWindow.jQuery = $;

  await import("jquery-binarytransport");
  await import("./index");
}

void bootstrap();
