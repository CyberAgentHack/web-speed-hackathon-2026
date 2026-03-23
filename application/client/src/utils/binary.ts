const BINARY_CHUNK_SIZE = 0x8000;

export function bytesToBinaryString(bytes: Uint8Array): string {
  const chunks: string[] = [];

  for (let index = 0; index < bytes.length; index += BINARY_CHUNK_SIZE) {
    chunks.push(String.fromCharCode(...bytes.subarray(index, index + BINARY_CHUNK_SIZE)));
  }

  return chunks.join("");
}

export function binaryStringToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);

  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index);
  }

  return bytes;
}
