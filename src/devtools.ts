import {
  createAction,
  createDevtools,
  getWindow,
  parseJsonThen,
  toJSObject,
  toJsWithComputeds,
  updateState,
} from "./utils";
import { spy, getDebugName, trace, reaction, intercept, autorun } from "mobx";
import type {
  ConnectResponse,
  ActionType,
  Message,
  Store,
  MakeLoggableOptions,
} from "./type";
import { devtoolsMap, scheduled, storeMap } from "./const";

let isRecoding = true;
let isEnabled = false;
let isSpyEnabled = false;

const send = () => {
  if (scheduled.length) {
    setTimeout(() => {
      console.log("[debug] scheduled", scheduled);
      scheduled.forEach((fn) => fn());
      scheduled.length = 0;
      // const toSend = scheduled.pop();
      // console.log("[debug] send", toSend);
      // toSend?.();
    }, 0);
  }
};

const schedule = (
  name: string,
  action: ActionType,
  options: MakeLoggableOptions,
) => {
  console.log("[debug] schedule", name, action, options);
  const toSend = () => {
    const devtools = devtoolsMap.get(name);
    const store = storeMap.get(name);
    if (devtools && store) {
      devtools.send(action, toJsWithComputeds(store, options));
    }
  };
  scheduled.push(toSend);
};

const initMobxSpy = (storeName: string, options: MakeLoggableOptions) => {
  if (isSpyEnabled) return;
  isSpyEnabled = true;
  console.log("isSpyEnabled", isSpyEnabled);
  spy((change) => {
    if (!isRecoding) {
      return;
    }
    if (change.spyReportStart) {
      if ("development" === process.env.NODE_ENV && options.debug) {
        console.log("[debug] spyReportStart:", change);
      }
      if ("action" === change.type) {
        const fallbackStore = storeMap.get(storeName);
        // 如果是 runInAction trigger 的话，是没有 change.object
        const store = change.object || fallbackStore;
        const action = createAction(storeName, change, options);

        if (store) {
          schedule(storeName, action, options);
        }
      }
    } else if ("spyReportEnd" in change) {
      if ("development" === process.env.NODE_ENV && options.debug) {
        console.log("[debug] spyReportEnd:", change);
      }
      send();
    }
  });
};

const updateStateFromDevtools = (store: Store, newState: Store) => {
  const originalIsRecoding = isRecoding;
  isRecoding = false;
  updateState(store, newState);
  isRecoding = originalIsRecoding;
  return store;
};

const dispatchMonitorAction = (
  store: Store,
  devtools: ConnectResponse,
  options: MakeLoggableOptions,
) => {
  const initialStore = toJSObject(store, options);
  return function dispatchMonitorActionHandler(message: Message) {
    if ("DISPATCH" === message.type) {
      const payloadType = message.payload.type;
      switch (payloadType) {
        case "RESET": {
          devtools.init(updateStateFromDevtools(store, initialStore));
          return;
        }
        case "COMMIT": {
          devtools.init(toJsWithComputeds(store));
          return;
        }
        case "PAUSE_RECORDING":
          isRecoding = !isRecoding;
          return;
        case "ROLLBACK": {
          parseJsonThen<Store>(message.state, (newStore) => {
            devtools.init(updateStateFromDevtools(store, newStore));
          });
          return;
        }
        case "JUMP_TO_ACTION":
        case "JUMP_TO_STATE": {
          parseJsonThen<Store>(message.state, (newStore) =>
            updateStateFromDevtools(store, newStore),
          );
          return;
        }
        case "IMPORT_STATE": {
          const { nextLiftedState } = message.payload;
          if (nextLiftedState) {
            updateStateFromDevtools(store, nextLiftedState);
          }
        }
        default:
      }
    }
  };
};

export const initDevtools = (
  store: Store,
  options: MakeLoggableOptions = {},
) => {
  const storeName = getDebugName(store);
  if (devtoolsMap.has(storeName)) {
    return;
  }

  storeMap.set(storeName, store);
  const devtools = createDevtools(storeName, getWindow(options));
  if (devtools) {
    devtoolsMap.set(storeName, devtools);
    // 初始化 devtools
    devtools.init(toJSObject(store, options));
    // 订阅 devtools 事件
    devtools.subscribe(dispatchMonitorAction(store, devtools, options));
  }
};

const initMobxIntercept = (store: any, options: MakeLoggableOptions) => {
  const transformStore = options.beforeTransform(store);
  intercept(store, (newValue) => {
    console.log(
      "[debug] reaction:",
      store,
      options.beforeTransform(store),
      newValue,
    );
  });
};

export const addStoreToDevtools = (
  store: Store,
  options: MakeLoggableOptions = {},
) => {
  const storeName = getDebugName(store);

  if (isEnabled) {
    return;
  }
  isEnabled = true;

  // 初始化 spy
  initMobxSpy(storeName, options);
  console.log("fdsfds");
  // initMobxTrace(store, options);
  initDevtools(store, options);
};
