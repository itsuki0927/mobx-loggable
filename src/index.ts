import mobx, { isObservable } from "mobx";
import { addStoreToDevtools } from "./devtools";
import { isReduxDevtoolsAvailable, storeMap } from "./const";
import type { MakeLoggableOptions, Store } from "./type";
import { getWindow } from "./utils";

const makeLoggable = <T>(store: T, options: MakeLoggableOptions = {}) => {
  const currentWindow = getWindow(options);
  console.log("makeLoggable reload222", (window as any).__mobxGlobals);

  // spy 在生产环境是 noop
  if (
    "undefined" === typeof currentWindow ||
    "production" === process.env.NODE_ENV ||
    !isReduxDevtoolsAvailable(currentWindow)
  ) {
    return store;
  }

  if (!isObservable(store)) {
    throw new Error(
      `mobx-loggable: store is not observable: ${JSON.stringify(
        store,
        null,
        2,
      )}. Make sure you called makeAutoObservable/makeObservable before calling makeLoggable`,
    );
  }

  addStoreToDevtools(store as Store, options);

  currentWindow.store = storeMap;

  return store;
};

export default makeLoggable;
