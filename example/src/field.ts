import { mapValues } from "lodash-es";
import { action, computed, makeObservable as define, observable } from "mobx";
import { Any } from "./form";
import makeLoggable from "../../src";

export class Field<
  V = Any,
  Data extends object = object,
  ComputedProperties extends object = object,
> {
  // 构造参数信息
  form: any;
  /** 全局路径信息 */
  path: string;
  schema: any;
  disposers: (() => void)[] = [];
  // UI与校验 计算状态
  declare hidden: boolean;
  declare disabled: boolean;
  declare readPretty: boolean;
  declare dataSource: "dataSource" extends keyof ComputedProperties
    ? ComputedProperties["dataSource"] extends unknown[]
      ? ComputedProperties["dataSource"]
      : any[]
    : any[];
  // 校验相关的手动维护状态
  loading = false;
  validating = false;
  active = false;
  visited = false;
  modified = false;
  feedbacks: any[] = [];
  // 流程延迟控制
  timerHandles: IFieldTimerHandles = {};
  // 渲染的 DOM 节点 ref
  ref?: any;
  // 数据维护
  get initialValue(): V {
    return this.form.getInitialValuesIn(this.path) as V;
  }
  private set initialValue(value: V) {
    this.form.setInitialValuesIn(this.path, value);
  }
  get value(): V {
    return this.form.getValuesIn(this.path) as V;
  }
  private set value(value: V) {
    this.form.setValuesIn(this.path, value);
  }
  setValue(v: V) {
    this.value = v;
  }
  data!: Partial<Data>;
  updateData(mergeData: Partial<Data>) {
    Object.assign(this.data, mergeData);
  }
  private computedFnMap!: {
    [key in keyof ComputedProperties]: (
      f: Field<V, Data, ComputedProperties>,
    ) => ComputedProperties[key];
  };
  constructor(props: { form: any; path: any; schema: any }) {
    this.form = props.form;
    this.path = props.path;
    this.schema = props.schema;
    this.form.fields[this.path.toString()] = this;
    this.initialize();
    this.makeObservable();
    this.makeReactive();

    if (!import.meta.hot) {
      makeLoggable(this, {
        keys: ["path"],
        // beforeTransform: ({ path }) => {
        //   return { path };
        // },
      });
    }
  }
  initialize() {
    const { schema } = this;
    this.initialValue = schema.initialValue as V;
    this.value =
      schema.value === undefined ? this.initialValue : (schema.value as V);
    this.data = schema.data || {};
    // 对 computed 属性进行注册
    this.computedFnMap = {
      // 如果没有提供 Form Conceptual Value，使用默认值
      hidden: () => false,
      disabled: () => false,
      readPretty: () => false,
      dataSource: () => [],
      ...schema.computed,
    } as typeof this.computedFnMap;
    Object.keys(this.computedFnMap).forEach((key) => {
      Object.defineProperty(this, key, {
        get: () => this.computedFnMap[key as keyof ComputedProperties](this),
        configurable: true,
      });
    });
  }
  makeObservable() {
    // 对 computed 属性进行响应式声明
    const computedAnnotations = mapValues(this.computedFnMap, () => computed);
    define(this, {
      ...computedAnnotations,
      // 其他内置属性
      path: observable.ref,
      value: computed,
      initialValue: computed,
      data: observable.shallow,
      setValue: action,
      updateData: action,
      onInput: action,
      onFocus: action,
      onBlur: action,
      validate: action,
      // 手动维护的属性
      loading: observable.ref,
      validating: observable.ref,
      modified: observable.ref,
      active: observable.ref,
      visited: observable.ref,
      feedbacks: observable.ref,
    });
  }
  makeReactive() {}
  destroy() {
    this.disposers.forEach((dispose) => dispose());
  }
  match(pattern: any) {
    return pattern.toString() === this.path.toString();
  }
  query(pattern: any) {
    return this.form.query(pattern);
  }
  setLoading() {}
  /** 业务 UI 代码不直接调用，仅通过表单顶层完成调用 */
  async onInput(newValue: V) {
    this.value = newValue;
    // 对应了 modifySelf 逻辑
    this.modified = true;
  }
  async onFocus() {
    this.active = true;
    this.visited = true;
  }
  async onBlur() {
    this.active = false;
  }
  async validate(): Promise<boolean> {
    return false;
  }
}
