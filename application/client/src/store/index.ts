import { legacy_createStore as createStore, Dispatch, UnknownAction } from "redux";

const rootReducer = (state = {}) => state;

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = Dispatch<UnknownAction>;

export const store = createStore(rootReducer);
