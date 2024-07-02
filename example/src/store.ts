import { action, makeObservable, observable } from "mobx";
import makeLoggable from "../../src/index.ts";
import { SubCountStore } from "./store2.ts";

export class CountStore {
  count = 0;
  subStoreMappings: Record<string, SubCountStore> = {};
  // subStore: SubCountStore | null = null;

  constructor() {
    this.count = 0;
    makeObservable(this, {
      count: observable,
      subStoreMappings: observable.shallow,
      inc: action,
      dec: action,
    });
    makeLoggable(this);
  }

  init(length: number) {
    for (let index = 0; index < length; index++) {
      if (!this.subStoreMappings[index]) {
        this.subStoreMappings[index] = new SubCountStore();
      }
    }
  }

  inc() {
    ++this.count;
  }

  dec() {
    --this.count;
  }
}

const countStore = new CountStore();

export default countStore;
