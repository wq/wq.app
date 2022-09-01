import { NativeModules } from 'react-native';

if (!NativeModules.MGLLogging) {
    NativeModules.MGLLogging = {};
}
