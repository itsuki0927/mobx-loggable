# Mobx Loggable

**使用一行命令就可以使用 redux devtools**

在思考用哪一个状态管理的时候，一直使用的 mobx，但 mobx 有一个最大的痛点就是：调试工具不好用，然后我看到其他一些状态管理库：Zustand 使用 Redux devtools，于是一个奇怪的想法诞生了，那我可不可以把 mobx 连接上 redux devtools 呢？于是这个库就产生了。

> 前提：浏览器里面必须安装 redux devtools 扩展，地址[在这里](https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)。

```typescript
import makeLoggable from "@itsuki927/mobx-loggable";

class CountStore {
  constructor() {
    makeAutoObservable(this);
    // 添加这一行
    makeLoggable(this);
  }
}
```

目前仅支持 action 和 runInAction 的改变会同步到 redux devtools 中。
