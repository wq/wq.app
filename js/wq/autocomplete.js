/*
 * wq.app 1.0.0-dev - wq/autocomplete.js
 * Simple AJAX autocomplete leveraging the HTML5 <datalist> element
 * (c) 2014-2016, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['jquery', './json', './template', './spinner'],
function($, json, tmpl, spin) {

// Exported module variable
var auto = {
    'name': 'autocomplete'
};

auto.template = '{{#list}}<option value="{{id}}">{{label}}</option>{{/list}}';

auto.init = function(template) {
    if (template) {
        auto.template = template;
    }
};

// Automatically register callbacks for every datalist
auto.run = function($page) {
    $page.find('datalist, [data-wq-datalist]').each(function(i, datalist) {
        /* jshint unused: false */
        auto.register($(datalist), $page);
    });
};

// Register a jQuery-wrapped datalist element.  Changes to associated inputs
// will trigger an update.
auto.register = function($datalist, $scope) {
    var $input;
    if (!$scope) {
        $scope = $datalist.parents('body');
    }
    $input = $scope.find('input[list="' + $datalist.attr('id') + '"]');
    if (!$input.length || $input.data('wq-registered')) {
        return;
    } else {
        $input.on('input.autocomplete', _update);
        $input.data('wq-registered', true);
    }

    function _update() {
        auto.update($datalist, $input.val());
    }
};

var _cache = {};
auto.update = function($datalist, value) {
    var url = $datalist.data('wq-url'),
        param = $datalist.data('wq-query') || 'q',
        min = $datalist.data('wq-min') || 3,
        exists = $datalist.find(
            'option[value="' + value.replace('"', "'") + '"]'
        ).length;

    // Only continue if a long enough value is present
    if (!value || value.length < min) {
        return;
    }

    // Compute full query url & re-use cached version if present
    url += url.indexOf('?') > -1 ? '&' : '?';
    url += param + '=' + value;
    if (_cache[url]) {
        auto.render($datalist, _cache[url]);
        return;
    }

    // Load results via AJAX
    if (!exists) {
        spin.start();
    }
    json.get(url).then(function(result) {
        if (!exists) {
            spin.stop();
        }
        if (!result.list) {
            result = {'list': result};
        }
        result.count = result.count || result.list.length;
        result.multi = result.count > 1;
        _cache[url] = result;
        auto.render($datalist, result);
    });

};

// Update <datalist> HTML with new <options>
auto.render = function($datalist, result) {
    var $options = $datalist.find('option, [data-wq-option]'),
        data = result.list,
        $tmpdl, $tmpopts, last;

    // Reset list if no data present
    if (!data || !data.length) {
        $datalist.empty();
        return;
    }

    // Don't update if list is the same as before
    if ($options.length == data.length) {
        $tmpdl = $("<datalist>");
        $tmpdl.append(tmpl.render(auto.template, result));
        $tmpopts = $tmpdl.find('option, [data-wq-option]');
        last = data.length - 1;
        if (getVal($options[0]) == getVal($tmpopts[0]) &&
                getVal($options[last]) == getVal($tmpopts[last])) {
            return;
        }
    }

    // Render data into template
    $datalist.empty().append(tmpl.render(auto.template, result));
};

function getVal(elem) {
    return $(elem).val() || $(elem).data('wq-value');
}
return auto;

});
