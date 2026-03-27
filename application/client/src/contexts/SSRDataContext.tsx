import { createContext } from "react";

export type SSRData = Record<string, unknown> | null;

export const SSRDataContext = createContext<SSRData>(null);
