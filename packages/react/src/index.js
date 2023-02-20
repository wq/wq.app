import react from "./react.js";
import App from "./App.js";
import { init, start, unmount } from "./init.js";

react.setEngine({ init, start, unmount, App });

export default react;
export * from "./react.js";
export * from "./hooks.js";
export { App };
