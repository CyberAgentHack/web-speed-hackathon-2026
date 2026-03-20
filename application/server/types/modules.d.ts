declare module "bluebird" {
  const Bluebird: {
    promisifyAll<T>(target: T): T;
  };

  export default Bluebird;
}

declare module "kuromoji" {
  interface Tokenizer {
    tokenize(text: string): unknown[];
  }

  interface Builder {
    build(callback: (error: unknown, tokenizer: Tokenizer) => void): void;
  }

  const kuromoji: {
    builder(options: { dicPath: string }): Builder;
  };

  export default kuromoji;
}

declare module "negaposi-analyzer-ja" {
  function analyze(tokens: unknown[]): number;

  export default analyze;
}

declare module "piexifjs" {
  const piexif: {
    ImageIFD: {
      ImageDescription: number;
    };
    load(data: string): {
      "0th"?: Record<number, string | number | undefined>;
    };
  };

  export default piexif;
}
