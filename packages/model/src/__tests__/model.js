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
    },
    form: [
        {
            name: 'type',
            'wq:ForeignKey': 'itemtype'
        },
        {
            name: 'color',
            choices: [
                {
                    label: 'Red',
                    name: '#f00'
                },
                {
                    label: 'Green',
                    name: '#0f0'
                },
                {
                    label: 'Blue',
                    name: '#00f'
                }
            ]
        },
        {
            name: 'values',
            type: 'repeat',
            children: [
                {
                    name: 'attribute',
                    'wq:ForeignKey': 'attribute'
                }
            ]
        }
    ],
    filter_ignore: ['ignore_this']
});

var itemtypes = model({
    name: 'itemtype',
    url: 'itemtypes',
    store: ds,
    cache: 'all',
    filter_fields: ['is_active']
});

model({
    name: 'attribute',
    url: 'attributes',
    store: ds,
    cache: 'all'
});

var values = model({
    name: 'value',
    store: ds,
    form: [
        {
            name: 'item',
            'wq:ForeignKey': 'item',
            'wq:related_name': 'values'
        },
        {
            name: 'attribute',
            'wq:ForeignKey': 'attribute'
        }
    ]
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
    expect(item.other_nested).toHaveLength(2);
});

test('find item - nested related model', async () => {
    const item = await items.find('one'),
        value = await values.find(1);
    expect(item.values).toHaveLength(2);
    expect(value.item_id).toEqual(item.id);
    expect(item.values[0]).toEqual(value);
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

test("don't filter by unknown field", async () => {
    // Explicitly ignored field
    const fitems1 = await items.filter({ ignore_this: 'foo' });
    expect(fitems1).toHaveLength(3);

    // Undeclared field (ignore anyway but warn)
    const fitems2 = await items.filter({ ignore_this_too: 'bar' });
    expect(fitems2).toHaveLength(3);
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

test('orm - objects.all()', async () => {
    await items.prefetch();
    expect(items.objects.all().count()).toBe(3);
});

test('orm - foreign key', async () => {
    await items.ensureLoaded();
    await itemtypes.ensureLoaded();
    const item = items.model.withId('one');
    expect(item.type_id).toEqual(1);
    expect(item.type && item.type.ref).toEqual({
        id: 1,
        label: 'Type #1',
        is_active: true
    });
});

test('orm - reverse lookup', async () => {
    await items.ensureLoaded();
    const item = items.model.withId('one');
    expect(item.ref.values).toBeUndefined();
    expect(item.values.toRefArray()).toHaveLength(2);
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

test('create - nested model', async () => {
    await items.create({
        id: 'five',
        values: [{ id: 100, value: 'Value', attribute_id: 1 }]
    });
    const item = items.model.withId('five'),
        value = values.model.withId(100);
    expect(item.ref.values).toBeUndefined();
    expect(value.item_id).toEqual(item.id);
    expect(item.values.toRefArray()[0]).toBe(value.ref);
});

test('create - related but not nested', async () => {
    await itemtypes.create({
        id: 4,
        label: 'Type #4',
        items: [{ id: 'item1' }]
    });
    await items.create({
        id: 'item2',
        type_id: 4
    });
    const itemtype = itemtypes.model.withId(4);
    expect(itemtype.ref.items).toEqual([{ id: 'item1' }]);
    expect(itemtype.items.toRefArray()).toEqual([{ id: 'item2', type_id: 4 }]);
    expect(await itemtypes.find(4)).toEqual({
        id: 4,
        label: 'Type #4',
        items: [{ id: 'item1' }]
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

test('update - nested model', async () => {
    await items.create({
        id: 'six',
        values: [
            { id: 101, value: 'Value 1', attribute_id: 1 },
            { id: 102, value: 'Value 2', attribute_id: 1 },
            { id: 103, value: 'Value 3', attribute_id: 1 }
        ]
    });

    const item1 = items.model.withId('six');
    expect(item1.values.count()).toEqual(3);

    await items.update({
        id: 'six',
        values: [
            { id: 102, value: 'Value 2 - Updated', attribute_id: 1 },
            { id: 104, value: 'Value 4', attribute_id: 1 }
        ]
    });

    const item2 = items.model.withId('six');
    expect(item2.values.count()).toEqual(2);
    expect(values.model.withId(102).value).toEqual('Value 2 - Updated');
    expect(values.model.withId(104).value).toEqual('Value 4');
});

test('update - change ID', async () => {
    await localmodel.overwrite([]);
    await localmodel.create({ id: 'local-1', label: 'Test 1' });
    await localmodel.update(
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

test('update - change ID & update related FK', async () => {
    await items.create({
        id: 'eihgt',
        values: [{ id: 301, value: 'Value', attribute_id: 1 }]
    });
    expect(values.model.withId(301).item_id).toBe('eihgt');

    await items.update({ id: 'eight' }, { currentId: 'eihgt' });

    const item = items.model.withId('eight');
    expect(item.values.count()).toEqual(1);
    expect(values.model.withId(301).item_id).toBe('eight');
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

test('delete - nested model', async () => {
    await items.create({
        id: 'seven',
        values: [{ id: 201, value: 'Value', attribute_id: 1 }]
    });

    const item1 = items.model.withId('seven');
    expect(item1.values.count()).toEqual(1);

    await items.remove('seven');

    expect(items.model.withId('seven')).toBeNull();
    expect(values.model.withId(201)).toBeNull();
});

test("overwrite - don't break foreign key", async () => {
    expect((await items.find('two')).type_id).toEqual(1);
    await itemtypes.overwrite(await itemtypes.load());
    expect((await items.find('two')).type_id).toEqual(1);
});

test('overwrite - remove obsolete items', async () => {
    await localmodel.overwrite([
        { id: 1, name: 'Test #1' },
        { id: 2, name: 'Test #2' }
    ]);
    await localmodel.overwrite([
        { id: 2, name: 'Test #2' },
        { id: 3, name: 'Test #3' }
    ]);
    expect(await localmodel.load()).toEqual({
        count: 2,
        pages: 1,
        per_page: 2,
        list: [{ id: 3, name: 'Test #3' }, { id: 2, name: 'Test #2' }]
    });
    await localmodel.overwrite([]);
    expect(await localmodel.load()).toEqual({
        count: 0,
        pages: 1,
        per_page: 0,
        list: []
    });
});
