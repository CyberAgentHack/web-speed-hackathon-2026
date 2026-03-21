import { getAverageColor } from "fast-average-color-node";

export async function computeAverageColor(imagePath: string): Promise<string> {
  const color = await getAverageColor(imagePath, { mode: "precision" });
  return color.rgb;
}
