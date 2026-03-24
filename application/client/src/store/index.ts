import { combineReducers, legacy_createStore as createStore, Reducer } from "redux";

type AnyState = Record<string, unknown>;

const _reducers: Record<string, Reducer> = {};

function buildReducer(): Reducer<AnyState> {
  if (Object.keys(_reducers).length === 0) {
    return (state: AnyState = {}) => state;
  }
  return combineReducers(_reducers) as Reducer<AnyState>;
}

export const store = createStore(buildReducer());

export function addReducer(key: string, reducer: Reducer): void {
  _reducers[key] = reducer;
  store.replaceReducer(buildReducer());
}

export type RootState = AnyState;
export type AppDispatch = typeof store.dispatch;
