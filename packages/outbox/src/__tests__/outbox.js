/**
 * @jest-environment @wq/jest-env-jsdom-idb
 */

import store from '@wq/store';
import outboxMod from '../outbox';
import model from '@wq/model';
import promiseFinally from 'promise.prototype.finally';

const ds = store.getStore('outbox-test');
const outbox = outboxMod.getOutbox(ds);

promiseFinally.shim();

const mockApp = {
    plugins: {},
    hasPlugin: () => true,
    callPlugins(method, args) {
        Object.values(this.plugins).forEach(plugin =>
            plugin[method].apply(plugin, args)
        );
    }
};

const models = {},
    modelConf = {};

['item', 'itemtype', 'attribute'].forEach(name => {
    modelConf[name] = {
        name: name,
        url: name + 's',
        list: true,
        cache: 'all',
        store: ds
    };
    models[name] = model(modelConf[name]);
});

ds.init({
    service: 'http://localhost:8080/tests',
    defaults: {
        format: 'json'
    }
});

beforeAll(async () => {
    await ds.ready;
    outbox.init({});
    outbox.app = mockApp;
});

beforeEach(async () => {
    await outbox.empty();
});

test('form with no explicit storage', async () => {
    await testOutbox({
        data: { test: 123 },
        options: {},
        expectItem: {
            id: 1,
            synced: false,
            data: { test: 123 },
            options: {}
        },
        expectStored: null
    });
});

test('form with storage=store', async () => {
    var blob = new Blob([1, 2, 3], { type: 'text/plain' });
    await testOutbox({
        data: {
            file: {
                type: 'text/plain',
                name: 'test.txt',
                body: blob
            }
        },
        options: {
            storage: 'store'
        },
        expectItem: {
            id: 1,
            synced: false,
            options: {
                storage: 'store'
            }
        },
        expectStored: {
            file: {
                type: 'text/plain',
                name: 'test.txt',
                body: blob
            }
        }
    });
});

test('form with storage=temporary', async () => {
    await testOutbox({
        data: { secret: 'code' },
        options: {
            storage: 'temporary'
        },
        expectItem: {
            id: 1,
            synced: false,
            options: {
                storage: 'temporary',
                once: true
            }
        },
        expectStored: null
    });
});

async function testOutbox(test) {
    await outbox.pause();
    await outbox.save(test.data, test.options);

    const actualOutbox = await outbox.loadItems(),
        actualStored = await ds.lf.getItem('outbox_1'),
        actualItem = await outbox.loadItem(1);

    const expectOutbox = {
        list: [test.expectItem],
        pages: 1,
        count: 1,
        per_page: 1
    };
    expect(actualOutbox).toEqual(expectOutbox);
    expect(actualStored).toEqual(test.expectStored);
    expect(actualItem.data).toEqual(test.data);
}

test('handle 200 success', async () => {
    const simple = {
        data: {
            label: 'Test'
        },
        options: {
            url: 'status/200'
        }
    };
    await outbox.save(simple.data, simple.options);
    await outbox.waitForItem(1);
    const syncedOutbox = await outbox.loadItems();
    const item = syncedOutbox.list[0];
    expect(item).toEqual({
        id: 1,
        synced: true,
        result: {
            id: item.result.id,
            ...simple.data
        },
        ...simple
    });
});

test('handle 400 error', async () => {
    const simple = {
        data: {
            label: 'Test'
        },
        options: {
            url: 'status/400'
        }
    };
    await outbox.save(simple.data, simple.options);
    await outbox.waitForItem(1);
    const syncedOutbox = await outbox.loadItems();
    const item = syncedOutbox.list[0];
    expect(item).toEqual({
        id: 1,
        synced: false,
        // retryCount: 1,
        error: {
            label: ['Not a valid label']
        },
        ...simple
    });
});

test('handle 500 error', async () => {
    const simple = {
        data: {
            label: 'Test'
        },
        options: {
            url: 'status/500',
            once: true
        }
    };
    await outbox.save(simple.data, simple.options);
    await outbox.waitForItem(1);
    const syncedOutbox = await outbox.loadItems();
    const item = syncedOutbox.list[0];
    expect(item).toEqual({
        id: 1,
        synced: false,
        // retryCount: 1,
        error: 'SERVER ERROR',
        ...simple
    });
});

test('onsync hook', async done => {
    const simple = {
        data: {
            label: 'Test'
        },
        options: {
            url: 'status/200'
        }
    };
    outbox.app.plugins.testplugin = { onsync };
    await outbox.save(simple.data, simple.options);

    function onsync(item) {
        expect(item).toEqual({
            id: 1,
            synced: true,
            result: {
                id: item.result.id,
                ...simple.data
            },
            ...simple
        });
        delete outbox.app.plugins.testplugin;
        done();
    }
});

test('sync dependent records in order - with ON_SUCCESS', async () => {
    const itemtype = {
        data: {
            label: 'New ItemType'
        },
        options: {
            url: 'itemtypes',
            modelConf: modelConf.itemtype
        }
    };

    var attribute = {
        data: {
            label: 'New Attribute'
        },
        options: {
            url: 'attributes',
            modelConf: modelConf.attribute
        }
    };

    var item = {
        data: {
            type_id: 'outbox-1',
            color: 'red',
            'values[0][attribute_id]': 'outbox-2',
            'values[0][value]': 'Test Value'
        },
        options: {
            url: 'items',
            modelConf: modelConf.item
        }
    };

    // Save three records to outbox
    await outbox.pause();
    await outbox.save(itemtype.data, itemtype.options);
    await outbox.save(attribute.data, attribute.options);
    await outbox.save(item.data, item.options);
    expect(await outbox.loadItems()).toEqual({
        list: [
            {
                id: 3,
                data: item.data,
                options: item.options,
                synced: false,
                parents: [1, 2]
            },
            {
                id: 2,
                data: attribute.data,
                options: attribute.options,
                synced: false
            },
            {
                id: 1,
                data: itemtype.data,
                options: itemtype.options,
                synced: false
            }
        ],
        pages: 1,
        count: 3,
        per_page: 3
    });

    // Sync records.  sendAll() should automatically sync the parent
    // records (itemtype, attribute) before syncing item.
    await outbox.resume();
    await outbox.waitForAll();
    const syncedOutbox = await outbox.loadItems();

    // All records should now be synced and have results
    let results = {};
    syncedOutbox.list.forEach(function(item) {
        const name =
            item.options &&
            item.options.modelConf &&
            item.options.modelConf.name;
        expect(item.synced).toBeTruthy();
        results[name] = item.result;
    });

    expect(results.item.type_id).toEqual(results.itemtype.id);
    expect(results.item.values[0].attribute_id).toEqual(results.attribute.id);
});

const ORIG_VALUE = 'Test',
    NEW_VALUE = 'Test 2';

async function checkName() {
    const item = await models.item.find('four');
    return item.name;
}

test('apply state ON_SYNC', async () => {
    await models.item.overwrite([{ id: 'four', name: ORIG_VALUE }]);
    outbox.pause();
    const { id } = await outbox.save(
        {
            id: 'four',
            name: NEW_VALUE
        },
        {
            url: 'items/four',
            method: 'POST', // FIXME: PUT doesn't work in jsdom 11 (#2300)
            modelConf: modelConf.item
        }
    );
    expect(await checkName()).toBe(ORIG_VALUE);
    outbox.resume();
    const item = await outbox.waitForItem(id);
    expect(item.synced).toBeTruthy();
    expect(await checkName()).toBe(NEW_VALUE);
});

test('apply state IMMEDIATE', async () => {
    await models.item.overwrite([{ id: 'four', name: ORIG_VALUE }]);
    outbox.pause();
    const { id } = await outbox.save(
        {
            id: 'four',
            name: NEW_VALUE
        },
        {
            url: 'items/four',
            method: 'POST', // FIXME: PUT doesn't work in jsdom 11 (#2300)
            applyState: 'IMMEDIATE',
            modelConf: modelConf.item
        }
    );
    expect(await checkName()).toBe(NEW_VALUE);
    outbox.resume();
    const item = await outbox.waitForItem(id);
    expect(item.synced).toBeTruthy();
    expect(await checkName()).toBe(NEW_VALUE);
});

test('apply state LOCAL_ONLY', async () => {
    await models.item.overwrite([{ id: 'four', name: ORIG_VALUE }]);
    const result = await outbox.save(
        {
            id: 'four',
            name: NEW_VALUE
        },
        {
            applyState: 'LOCAL_ONLY',
            modelConf: modelConf.item
        }
    );
    expect(result).toBeNull();
    expect((await outbox.loadItems()).list).toHaveLength(0);
    expect(await checkName()).toBe(NEW_VALUE);
});

test('sync dependent records in order - with IMMEDIATE', async () => {
    const itemtype = {
        data: {
            label: 'New ItemType'
        },
        options: {
            url: 'itemtypes',
            modelConf: modelConf.itemtype,
            applyState: 'IMMEDIATE'
        }
    };

    var attribute = {
        data: {
            label: 'New Attribute'
        },
        options: {
            url: 'attributes',
            modelConf: modelConf.attribute,
            applyState: 'IMMEDIATE'
        }
    };

    var item = {
        data: {
            type_id: 'outbox-1',
            color: 'red',
            'values[0][attribute_id]': 'outbox-2',
            'values[0][value]': 'Test Value'
        },
        options: {
            url: 'items',
            modelConf: modelConf.item,
            applyState: 'IMMEDIATE'
        }
    };

    // Save three records to outbox
    await outbox.pause();
    await outbox.save(itemtype.data, itemtype.options);
    await outbox.save(attribute.data, attribute.options);
    await outbox.save(item.data, item.options);

    expect(await outbox.loadItems()).toEqual({
        list: [
            {
                id: 3,
                data: item.data,
                options: item.options,
                synced: false,
                parents: [1, 2]
            },
            {
                id: 2,
                data: attribute.data,
                options: attribute.options,
                synced: false
            },
            {
                id: 1,
                data: itemtype.data,
                options: itemtype.options,
                synced: false
            }
        ],
        pages: 1,
        count: 3,
        per_page: 3
    });

    // Since IMMEDIATE is set, local models should already contain records
    expect(await models.itemtype.find('outbox-1')).toMatchObject({
        label: 'New ItemType'
    });
    expect(await models.attribute.find('outbox-2')).toMatchObject({
        label: 'New Attribute'
    });
    expect(await models.item.find('outbox-3')).toMatchObject({
        type_id: 'outbox-1',
        color: 'red',
        values: [
            {
                attribute_id: 'outbox-2',
                value: 'Test Value'
            }
        ]
    });

    // Sync records.  sendAll() should automatically sync the parent
    // records (itemtype, attribute) before syncing item.
    await outbox.resume();
    await outbox.waitForAll();
    const syncedOutbox = await outbox.loadItems();

    // All records should now be synced and have results
    let results = {};
    syncedOutbox.list.forEach(function(item) {
        const name =
            item.options &&
            item.options.modelConf &&
            item.options.modelConf.name;
        expect(item.synced).toBeTruthy();
        results[name] = item.result;
    });

    expect(results.item.type_id).toEqual(results.itemtype.id);
    expect(results.item.values[0].attribute_id).toEqual(results.attribute.id);

    // Local models should now be updated with the server-generated IDs, with
    // no trace of the outbox ids.
    expect(await models.itemtype.find('outbox-1')).toBeNull();
    expect(await models.attribute.find('outbox-2')).toBeNull();
    expect(await models.item.find('outbox-3')).toBeNull();

    expect(await models.itemtype.find(results.itemtype.id)).toMatchObject({
        label: 'New ItemType'
    });
    expect(await models.attribute.find(results.attribute.id)).toMatchObject({
        label: 'New Attribute'
    });
    expect(await models.item.find(results.item.id)).toMatchObject({
        type_id: results.itemtype.id,
        color: 'red',
        values: [
            {
                attribute_id: results.attribute.id,
                value: 'Test Value'
            }
        ]
    });
});
