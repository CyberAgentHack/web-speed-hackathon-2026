declare module "negaposi-analyzer-ja" {
  import type { IpadicFeatures } from "kuromoji";

  export default function analyze(tokens: IpadicFeatures[]): number;
}
