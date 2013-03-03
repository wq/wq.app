/*!
 * wq.app - chart.js
 * Reusable SVG charts for analyzing time-series data.
 * (c) 2013 S. Andrew Sheppard
 * http://wq.io/license
 */

define(["./lib/d3"],
function(d3) {

var chart = {};

// General chart configuration
chart.base = function() {
    var width=700, height=300, padding=10, 
        margins = {'left': 80, 'right': 10, 'top': 10, 'bottom': 80},
        scales = {};

    // Accessor for entire data object
    function datasets(d) {
        if (d.data)
            return d.data;
        return d;
    }

    // Accessors for individual datasets
    function id(d) {
        return d.id;
    }
    function items(d) {
        return d.list;
    }
    function units(d) {
        return d.units;
    }
    function ymax(d) {
        return d3.max(items(d), value);
    }
    function ymin(d) {
        return d3.min(items(d), value);
    }

    // Accessors for individual items
    function value(d) {
        return d.value;
    }
    
    // Render function (should be overridden)
    function render(data){};

    // Plot using given selection (usually a single object, but allow for array)
    function plot(sel) {
        sel.each(_plot);
    }

    // The actual work
    function _plot(data) {
        var svg = d3.select(this);
        var cwidth = width - padding - padding;
        var cheight = height - padding - padding;
        var gwidth = cwidth - margins.left - margins.right;
        var gheight = cheight - margins.top - margins.bottom;

        // Clip for inner graphing area
        var clip = svg.append('defs')
            .append('clipPath')
                .attr('id', 'clip')
            .append('rect')
                .attr('width', gwidth)
                .attr('height', gheight)

        // Outer chart area (includes legends, axes & actual graph)
        var outer = svg.append('g');
        outer.attr('transform', 'translate(' + padding + ',' + padding + ')')
        outer.append('rect')
            .attr('width', cwidth)
            .attr('height', cheight)
            .attr('fill', '#eee');

        // Inner graphing area (clipped)
        var inner = outer.append('g').attr('clip-path', 'url(#clip)');
        inner.attr('transform', 'translate(' + margins.left + ',' + margins.top + ')')
        inner.append('rect')
            .attr('width', gwidth)
            .attr('height', gheight)
            .attr('fill', '#ccc');

        // Compute vertical scales
        // - may be more than one if there are different units
        var left = true;
        datasets(data).forEach(function(d) {
            var sid = units(d);
            if (!scales[sid]) {
                scales[sid] = {
                    'id':   sid,
                    'ymin': 0,
                    'ymax': 0,
                    'sets': 0,
                    'orient': left ? 'left' : 'right'
                }
                left = !left;
            }
            var scale = scales[sid];
            scale.sets++;
            scale.ymax = d3.max([scale.ymax, ymax(d)]);
            scale.ymin = d3.min([scale.ymin, ymin(d)]);
        });

        // Create actual scale & axis objects
        for (sid in scales) {
            var scale = scales[sid];
            scale.scale = d3.scale.linear()
                .domain([scale.ymin, scale.ymax])
                .nice()
                .range([gheight, 0])

            scale.axis = d3.svg.axis()
                .scale(scale.scale)
                .orient(scale.orient);
        }
        
        // Render each dataset
        var series = inner.selectAll('g.dataset')
            .data(datasets(data));
        series.enter()
            .append('g')
            .attr('class', 'dataset')
            .each(render);

        // Render axes
        outer.selectAll('g.axis').data(d3.values(scales, id)).enter()
            .append('g')
            .attr('class', 'axis')
            .attr('transform', function(d) {
                var x = d.orient == 'left' ? margins.left : cwidth - margins.right;
                var y = margins.top;
                return 'translate(' + x + ', ' + y + ')';
            })
            .each(function(d) {
                d.axis(d3.select(this));
            });
    }

    // Getters/setters for chart configuration
    plot.width = function(val) {
        if (!arguments.length) return width;
        width = val;
        return plot;
    };
    plot.height = function(val) {
        if (!arguments.length) return height;
        height = val;
        return plot;
    };
    plot.margins = function(val) {
        if (!arguments.length) return margins;
        margins = val;
        return plot;
    }
    plot.scales = function(val) {
        if (!arguments.length) return scales;
        scales = val;
        return plot;
    }

    // Getters/setters for accessors
    plot.items = function(fn) {
        if (!arguments.length) return items;
        items = fn;
        return plot;
    }
    plot.value = function(fn) {
        if (!arguments.length) return value;
        value = fn;
        return plot;
    }
    plot.units = function(fn) {
        if (!arguments.length) return units;
        units = fn;
        return plot;
    }

    // Getter/setter for render function
    plot.render = function(fn) {
        if (!arguments.length) return render;
        render = fn;
        return plot;
    }

    return plot;
};

// Scatter plot
chart.scatter = function() {
    var plot = chart.base();

    function point(sid) {
        var scale = plot.scales()[sid].scale;
        var value = plot.value();
        return function(d) {
            var x = 100; //FIXME
            var y = scale(value(d));
            return 'translate(' + x + ',' + y + ')';
        }
    }

    plot.render(function(data) {
        var items = plot.items()(data);
        var units = plot.units()(data);

        d3.select(this).selectAll('g.data').data(items)
            .enter()
            .append('g')
                .attr('class', 'data')
                .attr('transform', point(units))
            .append('circle')
                .attr('r', 5)
    });

    return plot;
};

return chart;

});
