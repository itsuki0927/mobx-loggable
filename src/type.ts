declare global {
  interface Window {
    store?: Map<string, Store | Store[]>;
  }
}

export interface MakeLoggableOptions {
  getWindow?: () => Window;
  // 转化 store 的前置 hook
  beforeTransform?: <T>(store: T) => Partial<T>;
  // 是否需要 debug 输出, 只在 development 中生效
  debug?: boolean;
  keys?: string[];
}

export interface ReduxDevtoolsExtensionType {
  (config?: unknown): unknown;
  connect(options: DevtoolsOptions): ConnectResponse;
}

export interface DevtoolsOptions {
  name?: string;
  features: unknown;
}

export type Store = Record<string, unknown>;

export interface ActionType {
  type: string;
  payload?: unknown;
}

export interface Message {
  type: string;
  payload: {
    type: string;
    nextLiftedState?: Store;
  };
  state: string;
}

export interface ConnectResponse {
  init: (state: Store) => void;
  send: (data: ActionType, state: Store) => void;
  subscribe: (listener: (message: Message) => void) => (() => void) | undefined;
}
