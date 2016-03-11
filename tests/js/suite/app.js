define(['jquery', 'jquery.mobile', 'json-forms',
        'wq/app', 'wq/outbox', 'data/config', 'data/templates'],
function($, jqm, jsonforms, app, outbox, config, templates) {

QUnit.module('wq/app');

config.router = {
    'base_url': '/tests'
};

config.template = {
    'templates': templates
};

config.backgroundSync = -1;

return app.init(config).then(function() {
app.jqmInit();

QUnit.test("models defined", function(assert) {
    assert.ok(app.models.item);
    assert.ok(app.models.itemtype);
    assert.ok(app.models.contacttype);
});

testPage("item detail page", 'items/one', function($page, assert) {
    assert.equal($page.data('title'), "ONE", "page title");
    assert.equal($page.find('p#label').text(), "ONE", "item label");

    // Choice label
    assert.equal($page.find('p#color span').text(), "Red", "choice label");

    // Foreign key lookup
    var $fk = $page.find('p#type a');
    assert.equal($fk.text().trim(), "Type #1", "foreign key");
    assert.equal($fk.attr('href'), "/tests/itemtypes/1/items", "parent url");

    // Nested items
    var $children = $page.find('p.contact');
    assert.equal($children.length, 2, "nested child records");
    assert.equal(
        $children.filter('#contact-1').text(),
        "Owner: Contact One",
        "child record label"
    );
});

testPage("item edit page", 'items/two/edit', function($page, assert) {
    var done = assert.async();

    // Compare rendered form fields with model data
    var formdata = jsonforms.encode($page.find('form')[0]);
    app.models.item.find('two').then(function(data) {
        assert.equal(data.type_id, formdata.type_id, 'select field');
        assert.equal(data.color, formdata.color, 'radio field');
        assert.equal(
            data.contacts[0].name,
            formdata.contacts[0].name,
            'nested field'
        );

    // Submit form, confirm data is in outbox
    }).then(app.emptyOutbox).then(function() {
        $page.find('input#contacts-0-name').val("Test Change");
        $('body').on('pageshow', checkOutbox);
        $page.find('form').submit();
    });
    function checkOutbox() {
        $('body').off('pageshow', checkOutbox);
        assert.equal(
            jqm.activePage.data('url'),
            '/tests/items/',
            'submit returns to list view'
        );
        outbox.model.load().then(function(data) {
            assert.equal(data.list.length, 1, '1 item in outbox');
            var obitem = data.list[0];
            assert.equal(obitem.options.url, 'items/two', 'submission url');
            $('body').on('pageshow', editOutbox);
            $.mobile.changePage('/tests/outbox/1/edit');
        });
    }

    // Open form again from outbox and confirm that nested records still render
    function editOutbox() {
        $('body').off('pageshow', editOutbox);
        var $page = jqm.activePage;
        var formdata = jsonforms.encode($page.find('form')[0]);
        assert.equal(
            $page.find('form').data('wq-outbox-id'),
            1,
            'form rendered from outbox has id'
        );
        assert.equal(
            formdata.contacts.length,
            2,
            'form rendered from outbox has nested records'
        );
        done();
    }
});

function testPage(name, path, tests) {
    QUnit.test(name, function(assert) {
        var done = assert.async();

        $('body').on('pageshow', test);
        jqm.changePage('/tests/' + path);
        function test() {
            $('body').off('pageshow', test);
            tests(jqm.activePage, assert);
            done();
        }
    });
}

});

});
