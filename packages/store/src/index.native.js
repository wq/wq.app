import ds, { Store, getStore } from "./store.js";
import * as storage from "./storage.native.js";

ds.setStorage(storage);

export default ds;
export { Store, getStore };
