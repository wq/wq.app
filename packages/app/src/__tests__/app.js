/**
 * @jest-environment @wq/jest-env-jsdom-idb
 */

import app from '../app';
import patterns from '../patterns';
import photos from '../photos';
import router from '@wq/router';
import routeConfig from './config.json';
import templates from './templates.json';
import jQM from '@wq/jquery-mobile';
import { encode } from '@wq/outbox/vendor/json-forms';
import promiseFinally from 'promise.prototype.finally';

promiseFinally.shim();

var $, jqm;

beforeAll(async () => {
    $ = jQM(true);
    jqm = $.mobile;
    const config = {
        jQuery: $,
        router: {
            base_url: '/tests'
        },
        template: {
            templates
        },
        store: {
            service: 'http://localhost:8080/tests',
            defaults: { format: 'json' }
        },
        backgroundSync: -1,
        loadMissingAsJson: true,

        // Test warning messages
        postsave: function() {},
        showOutboxErrors: function() {},

        ...routeConfig
    };

    app.use(patterns);
    app.use(photos);
    app.use({
        context: function(context, routeInfo) {
            return Promise.resolve({
                context_page_url: context.page_config.url,
                route_info_mode: routeInfo.mode,
                route_info_parent_page: routeInfo.parent_page
            });
        }
    });
    await app.init(config);
    app.service = app.base_url;
    $('body').append('<div data-role=page></div>');
    app.jqmInit();
    await app.prefetchAll();
});

test('models defined', () => {
    expect(app.models.item).toBeTruthy();
    expect(app.models.itemtype).toBeTruthy();
    expect(app.models.attribute).toBeTruthy();
});

test('item detail page', async () => {
    const $page = await changePage('items/one');
    expect($page.data('title')).toBe('ONE');
    expect($page.find('p#label').text()).toBe('ONE');

    // Choice label
    expect($page.find('p#color span').text()).toBe('Red');

    // Foreign key lookup
    var $fk = $page.find('p#type a');
    expect($fk.text().trim()).toBe('Type #1');
    expect($fk.attr('href')).toBe('/tests/itemtypes/1');

    // Nested items
    var $children = $page.find('p.value');
    expect($children).toHaveLength(2);
    expect($children.filter('#value-1').text()).toBe('Width: Value One');
});

test('item edit page', async () => {
    var $page = await changePage('items/two/edit');

    // Compare rendered form fields with model data
    expect($page.find('form')).toHaveLength(1);
    var formdata = encode($page.find('form')[0]);

    const data = await app.models.item.find('two');
    expect(+formdata.type_id).toEqual(data.type_id);
    expect(formdata.color).toEqual(data.color);
    expect(formdata.values[0].value).toEqual(data.values[0].value);

    // Submit form, confirm data is in outbox
    await app.emptyOutbox();
    await app.outbox.pause();
    $page.find('input#values-0-value').val('Test Change');
    $page = await submitForm($page);

    expect(jqm.activePage.data('url')).toBe('/tests/items/');
    const obdata = await app.outbox.loadItems();
    expect(obdata.list).toHaveLength(1);
    var obitem = obdata.list[0];
    expect(obitem.options.url).toBe('items/two');

    // Open form again from outbox and confirm that nested records still render
    $page = await changePage('outbox/1/edit');
    formdata = encode($page.find('form')[0]);
    expect($page.find('form').data('wq-outbox-id')).toBe(1);
    expect(formdata.values).toHaveLength(2);
});

test('postsave - default', async () => {
    let $page;

    $page = await changePage('items/new');
    $page.find('input[name=label]').val('TEST');
    $page = await submitForm($page);
    expect($page.data('url')).toBe('/tests/items/');
});

test('postsave - wq page configuration', async () => {
    let $page;

    app.config.pages.item.postsave = 'items/?parent_id={{parent_id}}';

    $page = await changePage('items/new');
    $page.find('input[name=label]').val('TEST 2');
    $page.find('select[name=parent_id]').val('one');
    $page = await submitForm($page);
    expect($page.data('url')).toBe('/tests/items/?parent_id=one');

    delete app.config.pages.item.postsave;
});

test('postsave - postsaveurl plugin hook', async () => {
    let $page;

    app.use({
        name: 'postsavetest',
        postsaveurl: function(item) {
            const { data } = item,
                { type_id } = data;
            if (type_id) {
                return `/tests/itemtypes/${type_id}/items`;
            }
        }
    });

    $page = await changePage('items/new');
    $page.find('input[name=label]').val('TEST 3');
    $page.find('select[name=type_id]').val(1);
    $page = await submitForm($page);
    expect($page.data('url')).toBe(`/tests/itemtypes/1/items`);

    $page = await changePage('items/new');
    $page.find('input[name=label]').val('TEST 4');
    $page = await submitForm($page);
    expect($page.data('url')).toBe(`/tests/items/`);

    delete app.plugins.postsavetest;
});

test('sync refresh', async () => {
    let $page;

    // Submit form
    await app.emptyOutbox();
    await app.outbox.pause();
    $page = await changePage('items/new');
    $page.find('input[name=label]').val('TEST');
    $page = await submitForm($page);

    // Unsynced item should show in list view
    expect($page.data('url')).toBe('/tests/items/');
    expect($page.find("a[href='/tests/outbox/1']")).toHaveLength(1);

    // Sync
    await app.outbox.resume();
    const item = await app.outbox.waitForItem(1);
    expect(item.synced).toBeTruthy();

    await nextTick();

    // Item should be gone from list view
    $page = jqm.activePage;
    expect($page.find("a[href='/tests/outbox/1']")).toHaveLength(0);
});

test('sync refresh - update URL', async () => {
    let $page;

    app.models.item.opts.server = false;

    // Submit form 1 (parent)
    await app.emptyOutbox();
    await app.outbox.pause();
    $page = await changePage('itemtypes/new');
    $page.find('input[name=label]').val('TEST');
    await submitForm($page);

    // Submit form 2 (child)
    $page = await changePage('items/new');
    $page.find('input[name=label]').val('TEST');
    $page.find('select[name=type_id]').val('outbox-1');
    await submitForm($page);

    // Navigate to child list filtered by unsynced parent
    $page = await changePage('itemtypes/outbox-1/items');
    expect($page.find('li a')[0].href).toBe('http://localhost/tests/outbox/2');

    // Trigger sync
    await app.outbox.resume();
    const item1 = await app.outbox.waitForItem(1);
    const item2 = await app.outbox.waitForItem(2);

    // List URL should update to reflect new parent id
    await nextTick();
    $page = jqm.activePage;
    expect($page.data('url')).toBe(`/tests/itemtypes/${item1.result.id}/items`);
    expect($page.find('li a')[0].href).toBe(
        `http://localhost/tests/items/${item2.result.id}`
    );

    app.models.item.opts.server = true;
});

test('show outbox errors - background sync', async () => {
    let $page, $link;

    // Submit form
    await app.emptyOutbox();
    await app.outbox.pause();
    $page = await changePage('items/new');
    $page.find('form').attr('action', '/tests/items/error');
    $page.find('input[name=label]').val('Invalid');
    $page = await submitForm($page);

    // Unsynced item should show in list view
    expect($page.data('url')).toBe('/tests/items/');
    $link = $page.find("a[href='/tests/outbox/1']");
    expect($link.parents('li').data('icon')).toBeUndefined();

    // Attempt sync
    await app.outbox.resume();
    const item = await app.outbox.waitForItem(1);
    expect(item.synced).toBeFalsy();

    await nextTick();

    // Item should have an error flag
    $page = jqm.activePage;
    $link = $page.find("a[href='/tests/outbox/1']");
    expect($link.parents('li').data('icon')).toBe('alert');

    // Error should show up in form
    $page = await changePage('outbox/1/edit');
    await nextTick();
    expect($page.find('.error.item-label-errors').text()).toBe(
        'Not a valid label'
    );
});

test('show outbox errors - foreground sync', async () => {
    let $page;

    // Submit form in foreground
    await app.emptyOutbox();
    await app.outbox.pause();
    $page = await changePage('items/new');
    $page
        .find('form')
        .attr('action', '/tests/items/error')
        .data('wq-background-sync', false);
    $page.find('input[name=label]').val('Invalid');
    $page.find('form').submit();
    await nextTick();
    expect($page.find('form').attr('data-wq-outbox-id')).toBe('1');

    // Attempt sync
    await app.outbox.resume();
    await app.outbox.waitForItem(1);

    // Error should show up in form
    expect($page.find('.error.item-label-errors').text()).toBe(
        'Not a valid label'
    );
});

test('async context - other', async () => {
    const $page = await changePage('about');
    expect($page.find('#async').html()).toBe('URL: about, Mode: ');
});

test('async context - detail', async () => {
    const $page = await changePage('items/one');
    expect($page.find('#async').html()).toBe('URL: items, Mode: detail');
});

test('async context - edit', async () => {
    const $page = await changePage('items/one/edit');
    expect($page.find('#async').html()).toBe('URL: items, Mode: edit');
});

test('async context - list', async () => {
    const $page = await changePage('items/');
    expect($page.find('#async').html()).toBe('URL: items, Mode: list');
});

test('async context - list (filtered)', async () => {
    const $page = await changePage('itemtypes/1/items');
    expect($page.find('#async').html()).toBe(
        'URL: items, Mode: list (filtered by itemtype)'
    );
});

testEAV('empty', {}, '', [1, 2, 3, 4]);
testEAV('campaign id', { campaign_id: '+{{campaign_id}}' }, 'campaign_id=2', [
    3,
    4
]);
testEAV('campaign id miss', { campaign_id: '{{campaign_id}}' }, 'foo=bar', []);
testEAV('is active true', { is_active: '1' }, '', [1, 3]);
testEAV('is active false', { is_active: '0' }, '', [2, 4]);
testEAV(
    'is active true + campaign id',
    { is_active: '1', campaign_id: '{{campaign_id}}' },
    'campaign_id=1',
    [1]
);
testEAV('category', { category: 'dimension' }, '', [1, 2]);
testEAV('category empty', { category: '' }, '', [4]);
testEAV(
    'category empty context',
    { category: '{{category}}' },
    'category=',
    []
);

async function changePage(path, path2) {
    if (path2) {
        await changePage(path);
        await new Promise(res => setTimeout(res, 50));
        return await changePage(path2);
    }
    var done;
    const promise = new Promise(resolve => {
        done = resolve;
    });

    $('body').on('pageshow.changepage', next);
    router.push('/tests/' + path); //, { transition: 'none' });

    function next() {
        if (jqm.activePage.jqmData('url') != '/tests/' + path) {
            // FIXME: Sometimes / is shown before navigating to path?
            return;
        }
        $('body').off('pageshow.changepage', next);
        done(jqm.activePage);
    }

    return promise;
}

async function submitForm($page) {
    var done;
    const promise = new Promise(resolve => {
        done = resolve;
    });

    $('body').on('pageshow', next);
    $page.find('form').submit();

    function next() {
        $('body').off('pageshow', next);
        done(jqm.activePage);
    }

    return promise;
}

function testEAV(name, filter, params, expected) {
    test('eavfilter - ' + name, async () => {
        app.wq_config.pages.item.form[3].initial.filter = filter;
        var url = 'items/new';
        if (params) {
            url += '?' + params;
        }
        await changePage('items/', url);
        var context = router.store.getState().context;
        var ids = (context.values || []).map(function(value) {
            return value.attribute_id;
        });
        expect(ids).toEqual(expected);
        app.wq_config.pages.item.form[3].initial.filter = {};
    });
}

// Skip a tick to wait for some other callback to complete
async function nextTick() {
    await new Promise(res => setTimeout(res, 1));
}

test('patterns plugin', async () => {
    var $page = await changePage('items/', 'items/new'),
        $button = $page.find('#addvalue');
    expect($page.find('.section-values')).toHaveLength(4);
    $button.click();
    $button.click();
    expect($page.find('.section-values')).toHaveLength(6);
});

test('photos plugin', async () => {
    var blob = await app.plugins.photos.base64toBlob('ABCDE');
    expect(blob.type).toEqual('image/jpeg');
    expect(blob.size).toEqual(3);
});
