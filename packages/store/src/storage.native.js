import { AsyncStorage } from 'react-native';

export const storeAsString = true;

export function createStorage() {
    return AsyncStorage;
}
