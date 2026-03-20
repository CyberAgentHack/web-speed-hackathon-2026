declare global {
  var __BUILD_INFO__: {
    BUILD_DATE: string | undefined;
    COMMIT_HASH: string | undefined;
  };
}

declare const __BUILD_DATE__: string;
declare const __COMMIT_HASH__: string;

/** @note 競技用サーバーで参照します。可能な限りコード内に含めてください */
window.__BUILD_INFO__ = {
  BUILD_DATE: __BUILD_DATE__,
  COMMIT_HASH: __COMMIT_HASH__,
};

export {};
