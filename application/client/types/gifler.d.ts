declare module "gifler" {
  import type { GifReader, Frame } from "omggif";

  // フレームデータにピクセル配列が含まれることを定義
  export interface FrameWithPixels extends Frame {
    pixels: Uint8ClampedArray;
    buffer: Uint32Array; // giflerが内部で生成するバッファ
  }

  export class Animator {
    constructor(reader: GifReader, frames: FrameWithPixels[]);
    start(): void;
    stop(): void;
    // キャンバスに描画を開始するメインメソッド
    animateInCanvas(canvas: HTMLCanvasElement, adaptive?: boolean): void;
    // 各フレームの更新時に呼ばれるコールバック
    onFrame(fn: (ctx: CanvasRenderingContext2D, frame: FrameWithPixels) => void): Animator;
  }

  export class Decoder {
    static decodeFramesSync(reader: GifReader): FrameWithPixels[];
  }

  /**
   * giflerのメインインターフェース
   */
  export interface GiflerInstance {
    // アニメーターを準備してコールバックに渡す
    get: (callback: (animator: Animator) => void) => Promise<void>;
    // 指定したキャンバスで即座にアニメーションを開始する
    animate: (canvas: HTMLCanvasElement | string) => Promise<Animator>;
  }

  // メイン関数
  export function gifler(url: string | ArrayBuffer | Blob): GiflerInstance;

  export default gifler;
}
