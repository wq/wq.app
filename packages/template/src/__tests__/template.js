import tmpl from '../template';

beforeAll(() => {
    tmpl.init({
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
