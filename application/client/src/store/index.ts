import { combineReducers, legacy_createStore as createStore, Dispatch, UnknownAction } from "redux";

const rootReducer = combineReducers({
  // redux-form removed — placeholder reducer to keep redux store functional
  _placeholder: (state = null) => state,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = Dispatch<UnknownAction>;

export const store = createStore(rootReducer);
