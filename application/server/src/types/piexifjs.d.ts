declare module "piexifjs" {
  const piexif: {
    ImageIFD: {
      ImageDescription: number;
      [key: string]: number;
    };
    load(data: string): Record<string, Record<number, unknown>>;
    dump(exifObj: Record<string, Record<number, unknown>>): string;
    insert(exifStr: string, jpegData: string): string;
  };
  export default piexif;
}
