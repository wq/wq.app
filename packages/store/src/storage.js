import localForage from 'localforage';

export const storeAsString = false;

export function createStorage(name) {
    return localForage.createInstance({ name });
}
