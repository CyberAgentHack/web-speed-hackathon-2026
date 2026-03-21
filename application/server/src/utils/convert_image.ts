import sharp from "sharp";

export async function convertImage(input: Buffer): Promise<Buffer> {
  return await sharp(input).jpeg().withMetadata().toBuffer();
}
