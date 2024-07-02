import type { ConnectResponse, Store } from "./type";

export const isReduxDevtoolsAvailable = (currentWindow: Window) =>
  "undefined" !== typeof currentWindow &&
  currentWindow["__REDUX_DEVTOOLS_EXTENSION__"];

export const devtoolsMap = new Map<string, ConnectResponse>();

export const storeMap = new Map<string, Store>();

export const scheduled: (() => void)[] = [];
