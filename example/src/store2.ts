import { action, makeObservable, observable } from "mobx";
import makeLoggable from "../../src/index.ts";
import { CountStore } from "./store.ts";
// import { CountStore } from "./store.ts";

export class SubCountStore {
  subCount = 0;
  countStore;

  constructor() {
    this.countStore = new CountStore();
    makeObservable(this, {
      subCount: observable,
      subInc: action,
      subDec: action,
    });
    makeLoggable(this);
  }

  subInc() {
    ++this.subCount;
  }

  subDec() {
    --this.subCount;
  }
}

// const subCountStore = new SubCountStore();

// export default subCountStore;
