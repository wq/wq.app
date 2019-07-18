import store from '@wq/store';
import model from '../model';
import { URLSearchParams } from 'url';
global.URLSearchParams = URLSearchParams;

var ds = store.getStore('model-test');
var items = model({
    name: 'item',
    url: 'items',
    store: ds,
    cache: 'all',
    functions: {
        is_red: item => item.color === '#f00'
    }
});
var itemtypes = model({
    name: 'itemtype',
    url: 'itemtypes',
    store: ds,
    cache: 'all'
});
var localmodel = model({
    name: 'localmodel',
    store: ds
});

ds.init({
    service: 'http://localhost:8080/tests',
    defaults: {
        format: 'json',
        extra: 1
    }
});

test('load data list', async () => {
    const data = await items.load();
    expect(data).toBeTruthy();
    expect(data.list).toHaveLength(3);
    expect(data.count).toEqual(3);
    expect(data.pages).toEqual(1);
});

test('find item', async () => {
    const item = await items.find('one');
    expect(item.id).toEqual('one');
    expect(item.label).toEqual('ONE');
    expect(item.values).toHaveLength(2);
});

test('filter by single value', async () => {
    const fitems = await items.filter({ type_id: 1 });
    expect(fitems).toHaveLength(2);
    expect(fitems[0].id).toEqual('one');
    expect(fitems[1].id).toEqual('two');
});

test('filter by multiple values', async () => {
    const fitems = await items.filter({ color: ['#f00', '#00f'] });
    expect(fitems).toHaveLength(2);
    expect(fitems[0].id).toEqual('one');
    expect(fitems[1].id).toEqual('three');
});

test('filter by multiple keys, match any', async () => {
    const fitems = await items.filter({ color: '#f00', type_id: 2 }, true);
    expect(fitems).toHaveLength(2);
    expect(fitems[0].id).toEqual('one');
    expect(fitems[1].id).toEqual('three');
});

test('filter by computed value', async () => {
    const fitems = await items.filter({ is_red: true });
    expect(fitems).toHaveLength(1);
    expect(fitems[0].id).toEqual('one');
});

test('filter by boolean (true)', async () => {
    await testBooleanResult(true, 1),
        await testBooleanResult(1, 1),
        await testBooleanResult('t', 1);
});

test('filter by boolean (false)', async () => {
    await testBooleanResult(false, 2),
        await testBooleanResult(0, 2),
        await testBooleanResult('f', 2);
});

test('filter by boolean (null)', async () => {
    await testBooleanResult(null, 3), await testBooleanResult('null', 3);
});

test('filter by boolean (empty)', async () => {
    await testBooleanResult(undefined, null),
        await testBooleanResult('', null),
        await testBooleanResult('foo', null);
});

async function testBooleanResult(value, expectId) {
    const types = await itemtypes.filter({ is_active: value });
    if (expectId) {
        expect(types).toHaveLength(1);
        expect(types[0].id).toEqual(expectId);
    } else {
        expect(types).toHaveLength(0);
    }
}

test('filter by boolean & non-boolean', async () => {
    const types1 = await itemtypes.filter({ is_active: 'true', id: '1' });
    const types2 = await itemtypes.filter({ id: '1', is_active: 'true' });
    expect(types1).toHaveLength(1);
    expect(types1).toEqual(types2);
});

test('create', async () => {
    await localmodel.overwrite([]);

    // Update is really upsert
    await localmodel.update([
        { id: 1, label: 'Test 1' },
        { id: 2, label: 'Test 2' }
    ]);
    expect(await localmodel.info()).toEqual({
        count: 2,
        pages: 1,
        per_page: 2
    });

    await localmodel.create({ label: 'Test 3' });
    expect(await localmodel.load()).toEqual({
        count: 3,
        pages: 1,
        per_page: 3,
        list: [
            { id: 3, label: 'Test 3' },
            { id: 2, label: 'Test 2' },
            { id: 1, label: 'Test 1' }
        ]
    });
});

test('update', async () => {
    await localmodel.overwrite([]);
    await localmodel.create({ id: 1, label: 'Test 1' });
    await localmodel.update([{ id: 1, label: 'Update Test 1' }]);
    expect(await localmodel.info()).toEqual({
        count: 1,
        pages: 1,
        per_page: 1
    });
    expect(await localmodel.find(1)).toEqual({
        id: 1,
        label: 'Update Test 1'
    });
});

test('update - change ID', async () => {
    await localmodel.overwrite([]);
    await localmodel.create({ id: 'local-1', label: 'Test 1' });
    await localmodel.dispatch(
        'UPDATE',
        { id: 1234, label: 'Update Test 1' },
        { currentId: 'local-1' }
    );
    expect(await localmodel.load()).toEqual({
        count: 1,
        pages: 1,
        per_page: 1,
        list: [{ id: 1234, label: 'Update Test 1' }]
    });
});

test('delete', async () => {
    await localmodel.overwrite([]);
    await localmodel.create({ id: 1, label: 'Test 1' });
    await localmodel.remove(1);
    expect(await localmodel.load()).toEqual({
        count: 0,
        pages: 1,
        per_page: 0,
        list: []
    });
});
