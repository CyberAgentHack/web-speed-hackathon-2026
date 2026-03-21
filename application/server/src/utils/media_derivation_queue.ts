export interface MediaDerivationJob {
  key: string;
  run: () => Promise<void>;
}

class MediaDerivationQueue {
  private readonly pendingJobs: MediaDerivationJob[] = [];
  private readonly activeJobKeys = new Set<string>();
  private isRunning = false;

  enqueue(job: MediaDerivationJob): boolean {
    if (this.activeJobKeys.has(job.key)) {
      return false;
    }

    this.activeJobKeys.add(job.key);
    this.pendingJobs.push(job);
    void this.drain();
    return true;
  }

  private async drain(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      while (this.pendingJobs.length > 0) {
        const job = this.pendingJobs.shift();
        if (job === undefined) {
          continue;
        }

        try {
          await job.run();
        } catch (error) {
          console.error(`[media-derivation] job failed: ${job.key}`, error);
        } finally {
          this.activeJobKeys.delete(job.key);
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}

export const mediaDerivationQueue = new MediaDerivationQueue();

