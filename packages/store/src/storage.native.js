import AsyncStorage from '@react-native-community/async-storage';

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
    return JSON.parse(value, (key, val) => maybeParseDate(val));
}

function maybeParseDate(val) {
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
        try {
            return new Date(val);
        } catch (e) {
            return val;
        }
    } else {
        return val;
    }
}
