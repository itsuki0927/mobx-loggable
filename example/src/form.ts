/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  action,
  computed,
  makeAutoObservable,
  makeObservable,
  observable,
  runInAction,
} from "mobx";
import { Field } from "./field";
import makeLoggable from "../../src";

export type Any = any;

export type GeneralField = Any;

export interface IFormProps<
  ValueType extends object = Any,
  Context extends object = Any,
> {
  context?: Context;
  values?: ValueType;
  initialValues?: ValueType;
  readOnly?: boolean;
}
export class Form<
  ValueType extends object = Any,
  Context extends object = Any,
> {
  id?: string;
  props: IFormProps<ValueType>;
  disposers: (() => void)[] = [];
  config: any = {};
  readonly context: Context = {} as Context;
  /**
   * Startup 流程完成标志位
   *
   * 初始化完成前，新的联动不应当进行，数据同步也不应当进行
   */
  initialized = false;
  /** 所有的 Field 都是数据节点，无需实现 indexes 属性 */
  fields: Record<string, GeneralField> = {};
  values!: ValueType;
  // initialValues 逻辑请不要使用，请直接在创建form后设置值
  initialValues!: ValueType;
  constructor(props: IFormProps<ValueType, Context> = {}, config?: any) {
    this.id = "";
    this.props = { ...props };
    this.context = { ...((props.context || {}) as Context) };
    this.config = config || {};
    this.makeValues();
    this.makeObservable();

    if (!import.meta.hot) {
      makeLoggable(this, {
        getWindow: () => window,
        debug: true,
        keys: ["values"],
        // beforeTransform: ({ values }) => {
        //   return { values };
        //   // return store;
        // },
      });
    }
  }
  protected makeValues() {
    this.values = this.props.values || ({} as ValueType);
    this.initialValues = this.props.initialValues || ({} as ValueType);
  }
  protected makeObservable() {
    makeAutoObservable(this);
    // makeObservable(this, {
    //   id: observable,
    //   config: observable,
    //   context: observable.shallow,
    //   values: observable,
    //   initialValues: observable,
    //   fields: observable.shallow,
    //   initialized: observable,
    //   errors: computed,
    //   invalid: computed,
    //   markInitialized: action,
    //   setValuesIn: action,
    //   setInitialValuesIn: action,
    //   setId: action,
    //   setConfig: action,
    //   validate: action,
    //   destroy: action,
    // });
  }
  setConfig(config: any) {
    this.config = config;
  }
  /** 私有方法， 处理所属Form配置中拦截Input逻辑的行为函数 */
  beforeInput(changes: Record<any, unknown>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const { onBeforeFieldInputChange } = this.config.hooksConfig || {};
      if (typeof onBeforeFieldInputChange !== "undefined") {
        return Promise.all(
          onBeforeFieldInputChange.map((f) => f(changes)),
        ).then((res) => {
          const shouldContinue = res.every(Boolean);
          // eslint-disable-next-line prefer-promise-reject-errors
          shouldContinue ? resolve(true) : reject(false);
        });
      }
      resolve(true);
    });
  }
  markInitialized() {
    // 逻辑对应 onInit
    this.initialized = true;
  }
  setValuesIn(values: any) {
    this.values = values;
  }
  setId(id: any) {
    this.id = id;
  }
  getValuesIn() {}
  setInitialValuesIn() {}
  getInitialValuesIn() {}
  /** 使用 Schema 创建一个新的表单字段 */
  createField<S extends Any>(schema: { basePath?: any } & S) {
    const path = [schema.basePath, schema.name].filter(Boolean).join(".");
    console.log("path:", path);
    if (!this.fields[path]) {
      runInAction(() => {
        this.fields[path] = new Field({
          form: this,
          path,
          schema,
        });
      });
    }
    return this.fields[path];
  }
  query(): any {
    return [];
  }
  destroy() {
    this.query("*").forEach((field) => field.destroy());
    this.disposers.forEach((dispose) => dispose());
  }
  // 校验逻辑
  queryFeedbacks(search: any): any[] {
    const query = this.query(search.path || "*");
    return query.reduce(
      (messages, field) =>
        messages.concat(
          field.queryFeedbacks(search).filter((feedback) => feedback.message),
        ),
      [] as any[],
    );
  }
  get errors() {
    return this.queryFeedbacks({
      type: "error",
    });
  }
  get invalid() {
    return this.errors.length > 0;
  }
  async validate(pattern: any = "*") {
    return [];
  }
}

export function createForm<
  ValueType extends object,
  Context extends object = Any,
>(
  props?: IFormProps<ValueType, Context>,
  fieldSchema: Any[] = [],
  config?: any,
) {
  const form = new Form(props || {}, config);
  runInAction(() => {
    fieldSchema.forEach((schema) => {
      form.createField(schema);
    });
  });
  // TODO schema 解析，hooksConfig
  return form;
}
