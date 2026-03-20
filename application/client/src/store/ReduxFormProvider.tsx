import { PropsWithChildren } from "react";
import { Provider } from "react-redux";

import { store } from "@web-speed-hackathon-2026/client/src/store";

export const ReduxFormProvider = ({ children }: PropsWithChildren) => {
  return <Provider store={store}>{children}</Provider>;
};
