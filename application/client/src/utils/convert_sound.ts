interface Options {
  extension: string;
}

const SAMPLE_SOUND_PATH = "/sounds/10b3358c-945f-428e-a7f1-1558f675ef3d.mp3";

export async function convertSound(_file: File, _options: Options): Promise<Blob> {
  const response = await fetch(SAMPLE_SOUND_PATH);
  if (response.ok !== true) {
    throw new Error(`Failed to fetch sample sound: ${response.status} ${response.statusText}`);
  }

  const data = await response.arrayBuffer();
  return new Blob([data], { type: "audio/mpeg" });
}
