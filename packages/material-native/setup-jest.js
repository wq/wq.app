import { NativeModules } from 'react-native';

if (!NativeModules.PlatformLocalStorage) {
    NativeModules.PlatformLocalStorage = {};
}
