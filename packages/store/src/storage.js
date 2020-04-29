import localForage from 'localforage';

export function createStorage(name) {
    return localForage.createInstance({ name });
}

export const serialize = false;
export const deserialize = false;
