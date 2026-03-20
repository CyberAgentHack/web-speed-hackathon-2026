declare module "piexifjs" {
  export const ImageIFD: {
    ImageDescription: number;
    [key: string]: number;
  };
  export function load(data: string): Record<string, Record<number, unknown>>;
  export function dump(exifObj: Record<string, Record<number, unknown>>): string;
  export function insert(exifStr: string, jpegData: string): string;
}
