declare module "negaposi-analyzer-ja" {
  import type { IpadicFeatures } from "kuromoji";

  interface Options {
    unknownWordRank?: number;
    positiveCorrections?: number;
    negativeCorrections?: number;
    posiNegaDict?: object[];
  }

  function analyze(tokens: IpadicFeatures[], options?: Options): number;

  export = analyze;
}
