import type { Dispatch, UnknownAction } from "redux";
import { combineReducers, legacy_createStore as createStore } from "redux";
import type { FormAction } from "redux-form";
import { reducer as formReducer } from "redux-form";

const rootReducer = combineReducers({
  form: formReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = Dispatch<UnknownAction | FormAction>;

export const store = createStore(rootReducer);
