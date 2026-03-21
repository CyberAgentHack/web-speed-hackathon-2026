import { Mp3Encoder } from "lamejs";

interface Options {
  extension: string;
}

export async function convertSound(file: File, _options: Options): Promise<Blob> {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, 128);

  const left = floatTo16Bit(audioBuffer.getChannelData(0));
  const right = channels > 1 ? floatTo16Bit(audioBuffer.getChannelData(1)) : undefined;

  const mp3Data: ArrayBuffer[] = [];
  const blockSize = 1152;

  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize);
    const rightChunk = right?.subarray(i, i + blockSize);
    const buf = encoder.encodeBuffer(leftChunk, rightChunk);
    if (buf.length > 0) mp3Data.push(buf.buffer as ArrayBuffer);
  }

  const flush = encoder.flush();
  if (flush.length > 0) mp3Data.push(flush.buffer as ArrayBuffer);

  void audioContext.close();

  return new Blob(mp3Data, { type: "audio/mpeg" });
}

function floatTo16Bit(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]!));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}
