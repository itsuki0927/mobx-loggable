import {
  action as mobxAction,
  isComputedProp,
  isObservable,
  isAction,
  isObservableMap,
  isObservableSet,
  isObservableProp,
  isObservableArray,
  isObservableObject,
  isComputed,
  isFlow,
  isBoxedObservable,
  isFlowCancellationError,
  toJS,
  getDebugName,
} from "mobx";
import type {
  ActionType,
  MakeLoggableOptions,
  ReduxDevtoolsExtensionType,
  Store,
} from "./type";
import type { PureSpyEvent } from "mobx/dist/internal";

const getComputeds2 = (store: Store) => {
  const computeds: Record<string, unknown> = {};

  const functions = [
    isObservable,
    isAction,
    isObservableMap,
    isObservableSet,
    isObservableArray,
    isObservableObject,
  ];

  Object.getOwnPropertyNames(store).forEach((prop) => {
    if (typeof store[prop] === "function") {
      computeds[prop] = store[prop];
      return;
    }
    const findIndex = functions.findIndex((fn) => fn(store[prop]));
    if (findIndex !== -1) {
      // console.log("function:", functions[findIndex]);
      // computeds[prop] = store[prop]
      try {
        computeds[prop] = store[prop];
      } catch (e) {
        computeds[prop] = "*Exception*";
      }
      return;
    }
    if (isComputedProp(store, prop) || isObservableProp(store, prop)) {
      try {
        computeds[prop] = store[prop];
      } catch (e) {
        computeds[prop] = "*Exception*";
      }
    }
  });

  return computeds;
};

const getComputeds = (store: Store) => {
  const computeds: Record<string, unknown> = {};

  Object.getOwnPropertyNames(store).forEach((prop) => {
    if (isComputedProp(store, prop)) {
      try {
        computeds[prop] = store[prop];
      } catch (e) {
        computeds[prop] = "*Exception*";
      }
    }
  });

  return computeds;
};

export const toJSObject = (store: Store, options: MakeLoggableOptions = {}) => {
  const transformStore = options?.beforeTransform?.(store);
  console.log("[debug] transformStore:", transformStore);
  const result = { ...toJS(options?.beforeTransform?.(store)) };
  // console.log("toJSObject", result);
  return result;
};

export const toJsWithComputeds = (
  store: Store,
  options: MakeLoggableOptions = {},
) => {
  const result = {
    ...toJSObject(store, options),
    ...getComputeds(store),
  };
  console.log("[debug] toJsWithComputeds:", result);
  return result;
};

export const debugNameToHuman = (name: string) => name.replace(/@\d+/, "@");

export const parseJsonThen = <T>(
  stringified: string,
  f: (parsed: T) => void,
) => {
  let parsed: T | undefined;
  try {
    parsed = JSON.parse(stringified);
  } catch (e) {
    console.error("[mobx loggable] Could not parse the received json", e);
  }
  if (parsed !== undefined) {
    f(parsed as T);
  }
};

export const updateStateAction = (store: Store, state: Store) => {
  Object.keys(state).forEach((key) => {
    // 更新时计算属性不需要 set
    if (isComputedProp(store, key)) {
      return;
    }
    store[key] = state[key];
  });
  return state;
};

export const updateState = mobxAction("@@mobxLoggable", updateStateAction);

export const createDevtools = (name: string, currentWindow: Window) => {
  if (currentWindow["__REDUX_DEVTOOLS_EXTENSION__"]) {
    return (
      (currentWindow as any)
        .__REDUX_DEVTOOLS_EXTENSION__ as ReduxDevtoolsExtensionType
    ).connect({
      name,
      features: {
        pause: true, // start/pause recording of dispatched actions
        lock: true, // lock/unlock dispatching actions and side effects
        persist: true, // persist states on page reloading
        export: true, // export history of actions in a file
        import: "custom", // import history of actions from a file
        jump: true, // jump back and forth (time travelling)
        skip: true, // skip (cancel) actions
        reorder: true, // drag and drop actions in the history list
        dispatch: false, // dispatch custom actions or action creators
        test: false, // generate tests for the selected actions
      },
    });
  }
  return null;
};

// NOTE: 这里一定是 action 的 change，后续要兼容到其他 action
export function createAction(
  name: string,
  change?: PureSpyEvent,
  options?: MakeLoggableOptions,
) {
  if (!change || "action" !== change.type || !change.object) {
    return { type: name };
  }

  let type = debugNameToHuman(getDebugName(change.object)) || name;

  if ("name" in change && change.name) {
    type += change.name;
  }

  const action: ActionType = {
    type,
  };

  if (change.arguments.length) {
    action.payload = change.arguments;
  }

  if (
    !Array.isArray(action.payload) &&
    action.payload &&
    typeof action.payload === "object"
  ) {
    console.log("[debug] createAction", action);
  }

  return action;
}

export const getWindow = (options: MakeLoggableOptions = {}) => {
  const defaultGetWindow = () => window;
  return options.getWindow?.() || defaultGetWindow();
};
