declare module "negaposi-analyzer-ja" {
  interface Token {
    surface_form: string;
  }

  interface Options {
    unknownWordRank?: number;
    positiveCorrections?: number;
    negativeCorrections?: number;
    posiNegaDict?: object[];
  }

  function analyze(tokens: Token[], options?: Options): number;

  export = analyze;
}
