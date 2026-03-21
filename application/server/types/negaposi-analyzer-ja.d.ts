declare module "negaposi-analyzer-ja" {
  function analyze(tokens: { surface_form: string; pos: string }[]): number;
  export default analyze;
}
