interface Scheduler {
  yield: () => Promise<void>;
  postTask<T>(
    callback: () => T,
    options?: { priority?: "user-blocking" | "user-visible" | "background"; delay?: number },
  ): Promise<T>;
}

declare global {
  var scheduler: Scheduler;
}

export {};
