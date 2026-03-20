declare module "*?binary" {
  const value: Uint8Array<ArrayBuffer>;
  export default value;
}

declare module "*.css" {
  const value: Record<string, string>;
  export default value;
}
