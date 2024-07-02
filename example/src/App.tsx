import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import countStore from "./store";
import { observer } from "mobx-react";
import { useEffect } from "react";
import { createForm } from "./form";
import mockData from "./mock";

const formStore = createForm(
  {
    values: mockData,
    initialValues: mockData,
    context: mockData,
  },
  Array.from({ length: 1 }, (_, i) => ({
    basePath: `path-${i}`,
    name: `name-${i}`,
  })),
  { config: mockData },
);

function App() {
  // const count = countStore.count;
  // console.log("countStore:", countStore);
  // const subCount = countStore.subCountStore.subCount;

  console.log("formStore:", formStore);
  useEffect(() => {
    // countStore.init(50);
  }, []);

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <input
        onChange={(e) => formStore.setValuesIn(e.target.value)}
        value={formStore.values}
      />
      <input
        onChange={(e) => formStore.setId(e.target.value)}
        value={formStore.id}
      />
      <button
        onClick={() =>
          formStore.setConfig({ id: formStore.id, values: formStore.values })
        }
      >
        set config
      </button>
    </>
  );
}

export default observer(App);
