/*!
 * wq.app - chart.js
 * Reusable SVG charts for analyzing time-series data.
 * (c) 2013 S. Andrew Sheppard
 * http://wq.io/license
 */

define(["./lib/d3"],
function(d3) {

var chart = {};

function _trans(x, y) {
    return 'translate(' + x + ',' + y + ')';
}

// General chart configuration
chart.base = function() {
    var width=700, height=300, padding=7.5, 
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
    
    // Rendering functions (should be overridden)
    function init(datasets, opts){};
    function render(data){};
    function wrapup(datasets, opts){};

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
        outer.attr('transform', _trans(padding, padding));
        outer.append('rect')
            .attr('width', cwidth)
            .attr('height', cheight)
            .attr('fill', '#eee');

        // Inner graphing area (clipped)
        var inner = outer.append('g').attr('clip-path', 'url(#clip)');
        inner.attr('transform', _trans(margins.left, margins.top));
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

        // Additional processing
        var opts = {
            'padding': padding,
            'gwidth': gwidth,
            'gheight': gheight,
            'cwidth': cwidth,
            'cheight': cheight
        }
        init.call(this, datasets(data), opts);
        
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
                return _trans(x, y);
            })
            .each(function(d) {
                d.axis(d3.select(this));
            });

        wrapup.call(this, datasets(data), opts);
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
    plot.id = function(fn) {
        if (!arguments.length) return id;
        id = fn;
        return plot;
    }
    plot.items = function(fn) {
        if (!arguments.length) return items;
        items = fn;
        return plot;
    }
    plot.units = function(fn) {
        if (!arguments.length) return units;
        units = fn;
        return plot;
    }
    plot.value = function(fn) {
        if (!arguments.length) return value;
        value = fn;
        return plot;
    }

    // Getters/setters for render functions
    plot.init = function(fn) {
        if (!arguments.length) return init;
        init = fn;
        return plot;
    }
    plot.render = function(fn) {
        if (!arguments.length) return render;
        render = fn;
        return plot;
    }
    plot.wrapup = function(fn) {
        if (!arguments.length) return wrapup;
        wrapup = fn;
        return plot;
    }
    return plot;
};

// Scatter plot
chart.scatter = function() {
    var plot = chart.base(),
        format = d3.time.format('%Y-%m-%d'),
        xscale = d3.time.scale(),
        cscale = d3.scale.category20(),
        xnice = d3.time.year;

    function xvalue(d) {
        return format.parse(d.date);
    }

    function translate(sid) {
        var yscale = plot.scales()[sid].scale;
        var yvalue = plot.value();
        var xscale = plot.xscale();
        return function(d) {
            var x = xscale(xvalue(d));
            var y = yscale(yvalue(d));
            return _trans(x, y);
        };
    }

    function point(sid) {
        var color = cscale(sid);
        return function(sel) {
            sel.append('circle')
                .attr('r', 3)
                .attr('fill', color)
                .attr('stroke', 'black')
        }
    }

    plot.init(function(datasets, opts) {
        var xmin = Infinity, xmax = -Infinity;
        datasets.forEach(function(data) {
            var items = plot.items()(data);
            xmin = d3.min([xmin, d3.min(items, xvalue)]);
            xmax = d3.max([xmax, d3.max(items, xvalue)]);
        });

        xscale.domain([xmin, xmax])
              .range([0, opts.gwidth]);
        if (xscale.nice)
              xscale.nice(xnice);

    });

    plot.render(function(data) {
        var items = plot.items()(data);
        var units = plot.units()(data);
        var sid   = plot.id()(data);
        d3.select(this).selectAll('g.data').data(items)
            .enter()
            .append('g')
                .attr('class', 'data')
                .attr('transform', translate(units))
            .call(point(sid))
    });

    plot.wrapup(function(datasets, opts) {
        var svg = d3.select(this),
            outer = svg.select('g'),
            margins = plot.margins(),
            xaxis = d3.svg.axis()
                .scale(xscale)
                .orient('bottom')
                
        var cbottom = opts.cheight - margins.bottom;
        outer.append('g')
            .attr('class', 'xaxis')
            .attr('transform', _trans(margins.left, cbottom))
            .call(xaxis);
        
        var legend = outer.append('g')
            .attr('class', 'legend')
            .attr('transform', _trans(margins.left, cbottom + 30))
        legend.append('rect')
            .attr('width', opts.gwidth)
            .attr('height', margins.bottom - 30)
            .attr('fill', 'white')
            .attr('stroke', '#999')

        legend.selectAll('g.legenditem')
            .data(datasets)
            .enter().append('g')
                .attr('class', 'legenditem')
                .append('g')
                    .attr('class', 'data')
                    .each(function(d, i) {
                        var g = d3.select(this),
                            sid = plot.id()(d);
                         
                        g.attr('transform', _trans(10, 10 + i * 12));
                        g.call(point(sid));
                        g.append('text')
                            .text(d.label)
                            .attr('transform', _trans(5, 5));
                    });
    });

    // Getters/setters for chart configuration
    plot.xscale = function(fn) {
        if (!arguments.length) return xscale;
        xscale = fn;
        return plot;
    };

    plot.xnice = function(val) {
        if (!arguments.length) return xnice;
        xnice = val;
        return plot;
    };

    plot.timeFormat = function(val) {
        if (!arguments.length) return format;
        format = d3.time.format(val);
        return plot;
    };

    return plot;
};

return chart;

});
