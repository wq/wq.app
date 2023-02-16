import ds, { Store, getStore } from "./store.js";
import * as storage from "./storage.js";

ds.setEngine(storage);

export default ds;
export { Store, getStore };
