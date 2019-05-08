import router from '../router';
import tmpl from '@wq/template';
import jQM from '@wq/jquery-mobile';

var jQuery;
beforeAll(() => {
    jQuery = jQM(true);
    router.init({
        jQuery,
        debug: true
    });
    tmpl.init({
        jQuery,
        templates: {
            test:
            '<html><body><div data-role=page>TEST {{title}} {{params}}</div></body></html>'
        }
    });
});

test('register route and render page', done => {
    router.register('test/<slug>', (match, ui, params) => {
        const slug = match[1],
            url = `test/{slug}`,
            context = {
                title: slug,
                params: JSON.stringify(params)
            };
        router.go(url, 'test', context, ui);
    });
    router.addRoute('test/<slug>', 's', testOnShow);
    router.jqmInit();

    jQuery.mobile.changePage('/test/1234?p=1', { transition: 'none' });

    const $page = jQuery('.ui-page-active');
    expect($page.text()).toEqual('TEST 1234 {"p":"1"}');

    function testOnShow(match) {
        const slug = match[1];
        expect(slug).toEqual('1234');
        done();
    }
});
