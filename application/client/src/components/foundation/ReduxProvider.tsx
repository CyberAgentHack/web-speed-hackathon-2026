import type { ReactNode } from "react";
import { Provider } from "react-redux";

import { store } from "@web-speed-hackathon-2026/client/src/store";

export const ReduxProvider = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);
