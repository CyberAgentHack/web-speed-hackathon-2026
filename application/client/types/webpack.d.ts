declare module "*?binary" {
  const value: Uint8Array<ArrayBuffer>;
  export default value;
}

declare module "*?url" {
  const value: string;
  export default value;
}
