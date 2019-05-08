const JSDOMEnvironment = require('jest-environment-jsdom');
const indexedDB = require('fake-indexeddb');
const IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

class IDBEnvironment extends JSDOMEnvironment {
    async setup() {
        await super.setup();

        // Set globals for e.g. localForage
        this.global.indexedDB = indexedDB;
        this.global.IDBKeyRange = IDBKeyRange;

        // FIXME: Blob isn't visible to realistic-structured-clone unless we
        // copy it to the main global space.
        global.Blob = this.global.Blob;
    }
    async teardown() {
        delete global.Blob;
        delete this.global.indexedDB;
        delete this.global.IDBKeyRange;
        await super.teardown();
    }
}

module.exports = IDBEnvironment;
