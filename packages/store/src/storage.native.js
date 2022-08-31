import AsyncStorage from '@react-native-async-storage/async-storage';

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

export function serialize(value) {
    return JSON.stringify(value);
}

export function deserialize(value) {
    return JSON.parse(value);
}
