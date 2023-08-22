import { NativeModules } from "react-native";

if (!NativeModules.MGLLogging) {
    NativeModules.MGLLogging = {};
}
for (const name of ["MGLLogging", "MGLOfflineModule", "MGLLocationModule"]) {
    const module = NativeModules[name];
    if (!module.addListener) {
        module.addListener = jest.fn();
    }
    if (!module.removeListeners) {
        module.removeListeners = jest.fn();
    }
}
