interface Options {
  extension: string;
}

export async function convertSound(file: File, options: Options): Promise<Blob> {
  // FIXME: Optimize the resource at server-side
  console.warn("convertSound is pretty much noop");
  return new Blob([file]);

  // const ffmpeg = await loadFFmpeg();

  // const exportFile = `export.${options.extension}`;

  // await ffmpeg.writeFile("file", new Uint8Array(await file.arrayBuffer()));

  // // 文字化けを防ぐためにメタデータを抽出して付与し直す
  // const metadata = await extractMetadataFromSound(file);

  // await ffmpeg.exec([
  //   "-i",
  //   "file",
  //   "-metadata",
  //   `artist=${metadata.artist}`,
  //   "-metadata",
  //   `title=${metadata.title}`,
  //   "-vn",
  //   exportFile,
  // ]);

  // const output = (await ffmpeg.readFile(exportFile)) as Uint8Array<ArrayBuffer>;

  // ffmpeg.terminate();

  // const blob = new Blob([output]);
  // return blob;
}
