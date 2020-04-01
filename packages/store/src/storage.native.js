import { AsyncStorage } from 'react-native';

export const storeAsString = true;

export function createStorage(name) {
    return {
        getItem(key) {
            return AsyncStorage.getItem(`${name}_${key}`);
        },
        setItem(key, value) {
            return AsyncStorage.setItem(`${name}_${key}`, value);
        }
    };
}
