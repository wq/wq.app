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
    router.store.init();
    router.register('test/<slug>', 'test_detail');
    tmpl.init({
        jQuery,
        templates: {
            404: '<html><body><div data-role=page>Not Found</div></body></html>',
            test_detail:
                '<html><body><div data-role=page>TEST {{title}} {{params}}</div></body></html>'
        }
    });
    router.jqmInit();
});

test('register route and render page', done => {
    router.addContextForRoute('test/<slug>', async ctx => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
            title: ctx.router_info.slugs.slug,
            params: JSON.stringify(ctx.router_info.params)
        };
    });
    router.onShow('test/<slug>', testOnShow);

    router.push('/test/1234?p=1');

    function testOnShow() {
        const $page = jQuery('.ui-page-active');
        expect($page.text()).toEqual('TEST 1234 {"p":"1"}');
        done();
    }
});
