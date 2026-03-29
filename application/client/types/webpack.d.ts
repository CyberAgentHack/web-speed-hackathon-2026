declare module "*?binary" {
  const value: Uint8Array<ArrayBuffer>;
  export default value;
}

declare module "*?raw" {
  const value: string;
  export default value;
}
