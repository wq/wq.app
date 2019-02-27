/*!
 * wq.app 1.1.1-dev - wq/chartapp.js
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
        'point_cutoff': 50,
        'timeseries_columns': {
            'x': 'date',
            'y': 'value',
        },
        'time_format': '%Y-%m-%d',
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
        timeseriesX = chartapp.config.timeseries_columns.x,
        timeFormat = chartapp.config.time_format,
        timeseriesY = chartapp.config.timeseries_columns.y,
        scatterX = chartapp.config.scatter_columns.x,
        scatterY = chartapp.config.scatter_columns.y,
        pointCutoff = chartapp.config.point_cutoff,
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
        plot.pointCutoff(pointCutoff);
    } else if (type == 'timeSeries') {
        plot.timeField(timeseriesX);
        plot.timeFormat(timeFormat);
        plot.valueField(timeseriesY);
        plot.pointCutoff(pointCutoff);
    }

    d3.select(elem).datum(data).call(plot);
};

return chartapp;

});
