import react from "./react.js";
import App from "./App.native.js";
import { init, start, unmount } from "./init.native.js";

react.setEngine({ init, start, unmount, App });

export default react;
export * from "./react.js";
export * from "./hooks.native.js";
export { App };
