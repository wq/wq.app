import tmpl from '../template';
import jQM from '@wq/jquery-mobile';

var jQuery;
beforeAll(() => {
    jQuery = jQM(true);
    tmpl.init({
        jQuery,
        templates: {
            test: '<html>{{>head}}<h1>{{title}}</h1></html>',
            page:
                '<html><div data-role=page><a data-role=button>{{link}}</a></div></html>'
        },
        partials: {
            head: '<link>'
        }
    });
});

test('render template', () => {
    expect(tmpl.render('test', { title: 'Test' })).toEqual(
        '<html><link><h1>Test</h1></html>'
    );
});

test('inject jQuery Mobile page', () => {
    jQuery.mobile.initializePage();
    jQuery.mobile.changePage(tmpl.inject('page', { link: 'Test' }, '/page'), {
        transition: 'none'
    });
    const $page = jQuery('.ui-page-active');
    expect($page.length).toEqual(1);
    expect($page.find('.ui-btn').text()).toEqual('Test');
});
