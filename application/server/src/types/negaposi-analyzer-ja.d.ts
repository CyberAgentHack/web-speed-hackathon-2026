declare module "negaposi-analyzer-ja" {
  import type { IpadicFeatures } from "kuromoji";
  function analyze(tokens: IpadicFeatures[]): number;
  export default analyze;
}
