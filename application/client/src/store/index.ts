import {
  combineReducers,
  legacy_createStore as createStore,
  type Dispatch,
  type UnknownAction,
} from "redux";
import { reducer as formReducer, type FormAction } from "redux-form";

const rootReducer = combineReducers({
  form: formReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = Dispatch<UnknownAction | FormAction>;

export const store = createStore(rootReducer);
