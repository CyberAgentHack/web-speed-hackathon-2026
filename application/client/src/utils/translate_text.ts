import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
}

interface ResponseBody {
  result: string;
}

export async function translateText(params: Params): Promise<string> {
  const response = await sendJSON<ResponseBody>("/api/v1/translations", params);
  return response.result;
}
