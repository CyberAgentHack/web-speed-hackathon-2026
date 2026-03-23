import { combineReducers, legacy_createStore as createStore, Dispatch, UnknownAction } from "redux";
import type { FormAction, FormStateMap } from "redux-form";

// Stub reducer — replaced async by the real formReducer from redux-form
const formReducerStub = (state: FormStateMap = {}): FormStateMap => state;

const makeRootReducer = (form: typeof formReducerStub) =>
  combineReducers({ form });

export const store = createStore(makeRootReducer(formReducerStub));

// Inject the real redux-form reducer asynchronously so it is not in the main bundle
import("redux-form").then(({ reducer: formReducer }) => {
  store.replaceReducer(makeRootReducer(formReducer as unknown as typeof formReducerStub));
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = Dispatch<UnknownAction | FormAction>;
