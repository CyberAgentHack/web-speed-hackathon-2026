export interface Writer {
  initialize(): Promise<void>;
  update(markdown: string): Promise<void>;
}
