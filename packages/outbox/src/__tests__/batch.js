/**
 * @jest-environment @wq/jest-env-jsdom-idb
 */

import store from '@wq/store';
import router from '@wq/router';
import outboxMod from '../outbox';
import model from '@wq/model';
import promiseFinally from 'promise.prototype.finally';

const ds = store.getStore('batch-test');
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

['item', 'itemtype'].forEach(name => {
    modelConf[name] = {
        name: name,
        url: name + 's',
        list: true,
        cache: 'all',
        store: ds
    };
    models[name] = model(modelConf[name]);
});

router.init({
    store: 'batch-test',
    jQuery: {
        mobile: {
            initializePage() {}
        }
    }
});

ds.init({
    service: 'http://localhost:8080/tests',
    defaults: {
        format: 'json'
    }
});

beforeAll(async () => {
    await ds.ready;
    outbox.init({
        batchService: 'batch',
        batchSizeMin: 0
    });
    outbox.app = mockApp;
    router.jqmInit();
});

beforeEach(async () => {
    await ds.ajax('http://localhost:8080/reset-batch-number', null, 'POST');
    await outbox.empty();
});

test('sync dependent records in order - with batchService', async () => {
    const itemtype = {
        data: {
            label: 'New ItemType'
        },
        options: {
            url: 'itemtypes',
            modelConf: modelConf.itemtype
        }
    };

    var item1 = {
        data: {
            type_id: 'outbox-1',
            color: 'red'
        },
        options: {
            url: 'items',
            modelConf: modelConf.item
        }
    };

    var item2 = {
        data: {
            type_id: 'outbox-1',
            color: 'green'
        },
        options: {
            url: 'items',
            modelConf: modelConf.item
        }
    };

    // Save three records to outbox
    await outbox.pause();
    await outbox.save(itemtype.data, itemtype.options);
    await outbox.save(item1.data, item1.options);
    await outbox.save(item2.data, item2.options);

    expect(await outbox.loadItems()).toEqual({
        list: [
            {
                id: 3,
                data: item2.data,
                options: item2.options,
                synced: false,
                parents: [1]
            },
            {
                id: 2,
                data: item1.data,
                options: item1.options,
                synced: false,
                parents: [1]
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

    // Sync
    await ds.ajax('http://localhost:8080/reset-batch-number', null, 'POST');
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
        results[name + item.id] = item.result;
    });

    // Check that items were sent in the minimal number of batches needed to
    // preserve foreign key order.
    expect(await models.itemtype.find(results.itemtype1.id)).toMatchObject({
        label: 'New ItemType',
        batch: 1
    });
    expect(await models.item.find(results.item2.id)).toMatchObject({
        type_id: results.itemtype1.id,
        color: 'red',
        batch: 2
    });
    expect(await models.item.find(results.item3.id)).toMatchObject({
        type_id: results.itemtype1.id,
        color: 'green',
        batch: 2
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
                batch: 1,
                ...simple.data
            },
            ...simple
        });
        delete outbox.app.plugins.testplugin;
        done();
    }
});
