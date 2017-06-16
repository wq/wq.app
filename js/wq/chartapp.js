/*!
 * wq.app 1.0.0rc2 - wq/chartapp.js
 * wq/chart.js+wq/pandas.js as a wq/app.js plugin
 * (c) 2016-2017, S. Andrew Sheppard
 * https://wq.io/license
 */

define(["d3", "./chart", "./pandas", "./console", "./template", "./json"],
function(d3, chart, pandas, console, tmpl, json) {

// Exported module variable
var chartapp = {
    'name': 'chartapp',
    'config': {
        'id_template': null,
        'label_template': null,
        'scatter_columns': {
            'x': null,
            'y': null
        }
    }
};

chartapp.init = function(conf) {
    json.extend(chartapp.config, conf || {});
};

// wq/app.js plugin
chartapp.run = function($page) {
    var $svg = $page.find('svg[data-wq-url]');
    if (!$svg.length) {
        return;
    }
    var type = $svg.data('wq-type'),
        url = $svg.data('wq-url');
    if (!type || !url) {
        return;
    }
    if (!chart[type]) {
        console.warn("Unknown chart type " + type + "!");
        return;
    }

    pandas.get(url, function(data) {
        return chartapp.create(data, type, $svg[0]);
    });
};

chartapp.create = function(data, type, elem) {
    var plot = chart[type](),
        id = chartapp.config.id_template,
        label = chartapp.config.label_template,
        scatterX = chartapp.config.scatter_columns.x,
        scatterY = chartapp.config.scatter_columns.y,
        keys;

    if ((!id || !label) && data.length) {
        keys = Object.keys(data[0]).filter(function(key) {
            return key != 'data';
        }).map(function(key) {
            return '{{' + key + '}}';
        }).sort();
        if (!id) {
            id = keys.join('-');
        }
        if (!label) {
            label = keys.join(' ');
        }
    }

    plot.id(function(dataset) {
        return tmpl.render(id, dataset);
    }).label(function(dataset) {
        return tmpl.render(label, dataset);
    });

    if (type == 'boxplot') {
        plot.xvalue(function(d) {
            var prefix = plot.prefix(),
                key = Object.keys(d).filter(function(key) {
                    return key.indexOf(prefix) == -1;
                })[0];
            return d[key];
        });
    } else if (type == 'scatter') {
        if ((!scatterX || !scatterY) && data.length) {
            var firstPoint = (data[0].data || [{}])[0] || {};
            keys = Object.keys(firstPoint).filter(function(key) {
                return key != 'date';
            }).sort();
            scatterX = keys[0];
            scatterY = keys[1];
        }
        plot.xvalue(function(d) {
            return +d[scatterX];
        });
        plot.yvalue(function(d) {
            return +d[scatterY];
        });
    }

    d3.select(elem).datum(data).call(plot);
};

return chartapp;

});
