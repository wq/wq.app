import react from "./react.js";
import App from "./App.js";
import Root from "./Root.js";

react.setEngine({ init() {}, start() {}, unmount() {} });

export default react;
export * from "./react.js";
export * from "./hooks.js";
export { App, Root };
