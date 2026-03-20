declare global {
  var __BUILD_INFO__: {
    BUILD_DATE: string | undefined;
    COMMIT_HASH: string | undefined;
  };
}

/** @note 競技用サーバーで参照します。可能な限りコード内に含めてください */
window.__BUILD_INFO__ = {
  BUILD_DATE: import.meta.env["VITE_BUILD_DATE"],
  COMMIT_HASH: import.meta.env["VITE_COMMIT_HASH"],
};

export {};
