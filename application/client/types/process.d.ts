// Vite define で置き換えられる process.env の型定義
declare const process: {
  env: {
    BUILD_DATE: string;
    COMMIT_HASH: string;
    NODE_ENV: string;
  };
};
