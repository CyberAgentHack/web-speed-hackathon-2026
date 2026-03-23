/**
 * 検索ページの軽量プリレンダリング
 * 検索フォームをHTMLとして生成しLCPを改善する
 */

export function renderSearchPage(): string {
  return `<div class="flex flex-col gap-4"><div class="bg-cax-surface p-4 shadow"><form><div class="flex gap-2"><div class="flex flex-1 flex-col"><input class="flex-1 rounded border px-4 py-2 focus:outline-none border-cax-border focus:border-cax-brand-strong" placeholder="検索 (例: キーワード since:2025-01-01 until:2025-12-31)" type="text" value=""></div><button class="flex items-center justify-center gap-2 rounded-full px-4 py-2 border bg-cax-brand text-cax-surface-raised hover:bg-cax-brand-strong border-transparent" type="submit">検索</button></div></form><p class="text-cax-text-muted mt-2 text-xs">since:YYYY-MM-DD で開始日、until:YYYY-MM-DD で終了日を指定できます</p></div></div>`;
}
