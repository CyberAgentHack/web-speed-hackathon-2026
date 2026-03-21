import { createContext, useContext } from "react";

import type { SSRData } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

const SSRDataContext = createContext<SSRData | null>(null);

export const SSRDataProvider = SSRDataContext.Provider;

export function useSSRData(): SSRData | null {
  return useContext(SSRDataContext);
}
