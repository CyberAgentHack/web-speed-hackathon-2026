export class WorkerManager {
  private static instance: Worker | null = null;
  private static resolvers = new Map<number, (value: any) => void>();
  private static rejecters = new Map<number, (reason: any) => void>();
  private static nextId = 0;

  static getWorker(): Worker {
    if (!this.instance) {
      this.instance = new Worker(new URL("./worker.ts", import.meta.url));
      this.instance.onmessage = (e) => {
        const { id, result, error } = e.data;
        if (error) {
          this.rejecters.get(id)?.(error);
        } else {
          this.resolvers.get(id)?.(result);
        }
        this.resolvers.delete(id);
        this.rejecters.delete(id);
      };
    }
    return this.instance;
  }

  static async request<T>(type: string, payload: any): Promise<T> {
    const id = this.nextId++;
    const worker = this.getWorker();
    return new Promise((resolve, reject) => {
      this.resolvers.set(id, resolve);
      this.rejecters.set(id, reject);
      const transfer = payload instanceof ArrayBuffer ? [payload] : [];
      worker.postMessage({ type, payload, id }, transfer);
    });
  }
}
