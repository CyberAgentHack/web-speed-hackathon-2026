/**
 * APIレスポンスのメモリキャッシュ。
 * fly.ioのshared CPUでSQLiteクエリのコストを削減し、API応答時間を短縮する。
 * POST /api/v1/initialize でクリアされる。
 */
class ApiCache {
  private cache = new Map<string, unknown>();

  get(key: string): unknown | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: unknown): void {
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();
