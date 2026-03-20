import type { Writer } from "./writer";

export class EmptyWriter implements Writer {
  async initialize(): Promise<void> {}
  async update(): Promise<void> {}
}
