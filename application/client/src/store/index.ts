import {
  combineReducers,
  legacy_createStore as createStore,
  type Dispatch,
  type Reducer,
  type UnknownAction,
} from "redux";

const asyncReducers: Record<string, Reducer> = {};
const noopReducer: Reducer = (state = null) => state;

function createRootReducer() {
  return combineReducers({
    __noop: noopReducer,
    ...asyncReducers,
  });
}

export type RootState = ReturnType<ReturnType<typeof createRootReducer>>;
export type AppDispatch = Dispatch<UnknownAction>;

export const store = createStore(createRootReducer());

export function registerReducer(name: string, reducer: Reducer) {
  if (asyncReducers[name] != null) {
    return;
  }

  asyncReducers[name] = reducer;
  store.replaceReducer(createRootReducer());
}
