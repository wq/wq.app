import jqmRenderer from '../jquery-mobile';

beforeAll(() => {
    jqmRenderer.app = { config: {} };
    jqmRenderer.init({
        templates: {
            test: '<html>{{>head}}<h1>{{title}}</h1></html>',
            page:
                '<html><div data-role=page><a data-role=button>{{link}}</a></div></html>',
            another_page: '<html><div data-role=page>{{title}}</div></html>',
            edit_page:
                '<html><div data-role=page><form action="/test"><input name=name></form></div></html>'
        },
        partials: {
            head: '<link>'
        },
        noScroll: true
    });
    global.jQuery = jqmRenderer.$;
});

test('jQuery in environment', () => {
    expect(global.jQuery).toBeTruthy();
});

test('jQuery Mobile in environment', () => {
    expect(global.jQuery.mobile).toBeTruthy();
});

test('inject jQuery Mobile page', () => {
    const $ = global.jQuery;
    $.mobile.changePage(jqmRenderer.inject('page', { link: 'Test' }, '/page'), {
        transition: 'none'
    });
    const $page = $('.ui-page-active');
    expect($page.length).toEqual(1);
    expect($page.jqmData('url')).toEqual('/page');
    expect($page.find('.ui-btn').text()).toEqual('Test');
});

test('render context and inject page', () => {
    return new Promise(done => {
        jqmRenderer.handleShow = testOnShow;
        jqmRenderer.renderPage({
            router_info: {
                name: 'another_page',
                template: 'another_page',
                full_path: '/anotherpage'
            },
            title: 'TEST 1234'
        });

        function testOnShow() {
            const $page = global.jQuery.mobile.activePage;
            expect($page.text()).toEqual('TEST 1234');
            done();
        }
    });
});

test('submit form', () => {
    return new Promise(done => {
        jqmRenderer.app = {
            submitForm,
            isRegistered: () => true,
            config: {}
        };
        jqmRenderer.handleShow = completeForm;
        jqmRenderer.renderPage({
            router_info: {
                name: 'edit_page',
                template: 'edit_page',
                full_path: '/edit'
            }
        });
        function completeForm($page) {
            $page.find('input').val('Test Value');
            $page.find('form').submit();
        }
        function submitForm(kwargs) {
            expect(kwargs).toMatchObject({
                url: '/test',
                has_files: false,
                data: { name: 'Test Value' }
            });
            done();
        }
    });
});
