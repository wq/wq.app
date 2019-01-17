define(['jquery', 'jquery.mobile', 'json-forms',
        'wq/app', 'wq/router', 'wq/map', 'wq/outbox', 'wq/markdown',
        'data/config', 'data/templates'],
function($, jqm, jsonforms,
         app, router, map, outbox, markdown,
         config, templates) {

QUnit.module('wq/app');

config.router = {
    'base_url': '/tests'
};

config.template = {
    'templates': templates
};

config.backgroundSync = -1;
config.loadMissingAsJson = true;

app.use(map);
app.use(markdown);
app.use({
    'context': function(context, routeInfo) {
        return Promise.resolve({
            'context_page_url': context.page_config.url,
            'route_info_mode': routeInfo.mode,
            'route_info_parent_page': routeInfo.parent_page
        });
    }
});

return app.init(config).then(function() {
app.jqmInit();

QUnit.test("models defined", function(assert) {
    assert.ok(app.models.item);
    assert.ok(app.models.itemtype);
    assert.ok(app.models.attribute);
});

testPage("item detail page", 'items/one', function($page, assert) {
    assert.equal($page.data('title'), "ONE", "page title");
    assert.equal($page.find('p#label').text(), "ONE", "item label");

    // Choice label
    assert.equal($page.find('p#color span').text(), "Red", "choice label");

    // Foreign key lookup
    var $fk = $page.find('p#type a');
    assert.equal($fk.text().trim(), "Type #1", "foreign key");
    assert.equal($fk.attr('href'), "/tests/itemtypes/1", "parent url");

    // Nested items
    var $children = $page.find('p.value');
    assert.equal($children.length, 2, "nested child records");
    assert.equal(
        $children.filter('#value-1').text(),
        "Width: Value One",
        "child record label"
    );

    // Markdown+syntax plugin
    var $code = $page.find('code'),
        $keywords = $code.find('span.hljs-keyword');
    assert.equal($code.length, 1, "markdown code block");
    assert.equal($keywords.length, 2, "highlighted keywords");
});

testPage("item edit page", 'items/two/edit', function($page, assert) {
    var done = assert.async();

    // Compare rendered form fields with model data
    var formdata = jsonforms.encode($page.find('form')[0]);
    app.models.item.find('two').then(function(data) {
        assert.equal(data.type_id, formdata.type_id, 'select field');
        assert.equal(data.color, formdata.color, 'radio field');
        assert.equal(
            data.values[0].value,
            formdata.values[0].value,
            'nested field'
        );

    // Submit form, confirm data is in outbox
    }).then(app.emptyOutbox).then(function() {
        $page.find('input#values-0-value').val("Test Change");
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
            formdata.values.length,
            2,
            'form rendered from outbox has nested records'
        );
        done();
    }
});

testPage("async context - other", "about", function($page, assert) {
    assert.equal(
        $page.find("#async").html(),
        "URL: about, Mode: ",
        "async context plugin works on 'other' pages"
    );
});

testPage("async context - detail", "items/one", function($page, assert) {
    assert.equal(
        $page.find("#async").html(),
        "URL: items, Mode: detail",
        "async context plugin works in 'detail' mode"
    );
});

testPage("async context - edit", "items/one/edit", function($page, assert) {
    assert.equal(
        $page.find("#async").html(),
        "URL: items, Mode: edit",
        "async context plugin works in 'edit' mode"
    );
});

testPage("async context - list", "items/", function($page, assert) {
    assert.equal(
        $page.find("#async").html(),
        "URL: items, Mode: list",
        "async context plugin works in 'list' mode"
    );
});

testPage("async context - list (filtered)", "itemtypes/1/items",
    function($page, assert) {
        assert.equal(
            $page.find("#async").html(),
            "URL: items, Mode: list (filtered by itemtype)",
            "async context plugin works on filtered list"
        );
    }
);


testEAV(
    "empty",
    {},
    "",
    [1, 2, 3, 4]
);
testEAV(
    "campaign id",
    {"campaign_id": "{{campaign_id}}"},
    "campaign_id=2",
    [3, 4]
);
testEAV(
    "campaign id miss",
    {"campaign_id": "{{campaign_id}}"},
    "foo=bar",
    []
);
testEAV(
    "is active true",
    {"is_active": "1"},
    "",
    [1, 3]
);
testEAV(
    "is active false",
    {"is_active": "0"},
    "",
    [2, 4]
);
testEAV(
    "is active true + campaign id",
    {"is_active": "1", "campaign_id": "{{campaign_id}}"},
    "campaign_id=1",
    [1]
);
testEAV(
    "category",
    {"category": "dimension"},
    "",
    [1, 2]
);
testEAV(
    "category empty",
    {"category": ""},
    "",
    [4]
);
testEAV(
    "category empty context",
    {"category": "{{category}}"},
    "category=",
    []
);

function testPage(name, path, tests, init) {
    QUnit.test(name, function(assert) {
        var done = assert.async();
        if (init) {
            init();
        }
        $('body').on('pageshow', test);
        app.nav(path);
        function test() {
            $('body').off('pageshow', test);
            tests(jqm.activePage, assert);
            done();
        }
    });
}

function testEAV(name, filter, params, expected) {
    testPage("eavfilter - " + name, "items/new?" + params,
        function($page, assert) {
            var ids = (router.info.context.values || []).map(function(value) {
                return value.attribute_id;
            }).join(',');
            assert.equal(
                ids, expected.join(','),
                "expected " + expected.length + " attributes"
            );
            app.wq_config.pages.item.form[3].initial.filter = filter;
        }, function() {
            app.wq_config.pages.item.form[3].initial.filter = filter;
        }
    );
}

});

});
