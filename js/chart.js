/*!
 * wq.app 0.4.1 - chart.js
 * Reusable SVG charts for analyzing time-series data.
 * (c) 2013, S. Andrew Sheppard
 * http://wq.io/license
 */

define(["./lib/d3"],
function(d3) {

var chart = {};

function _trans(x, y, off) {
    if (off) {
        x -= 0.5;
        y -= 0.5;
    }
    return 'translate(' + x + ',' + y + ')';
}

// General chart configuration
chart.base = function() {
    var width=700, height=300, padding=7.5,
        margins = {'left': 80, 'right': 10, 'top': 10, 'bottom': 30},
        xscale = null,
        xscalefn = d3.scale.linear,
        xnice = null,
        yscales = {},
        yscalefn = d3.scale.linear;

    // Accessor for entire data object
    function datasets(d) {
        if (d.data)
            return d.data;
        return d;
    }

    // Accessors for individual datasets
    function id(dataset) {
        return dataset.id;
    }
    function label(dataset) {
        return dataset.label;
    }
    function items(dataset) {
        return dataset.list;
    }

    function xunits(dataset) {throw "xunits accessor not defined!";}
    function xmax(dataset) {
        return d3.max(items(dataset), xvalue);
    }
    function xmin(dataset) {
        return d3.min(items(dataset), xvalue);
    }

    function yunits(dataset) {
        return dataset.units;
    }
    function ymax(dataset) {
        return d3.max(items(dataset), yvalue);
    }
    function ymin(dataset) {
        return d3.min(items(dataset), yvalue);
    }

    // Accessors for individual items
    function xvalue(d) {throw "xvalue accessor not defined!";}
    function yvalue(d) {throw "yvalue accessor not defined!";}

    // Rendering functions (should be overridden)
    function init(datasets){}
    function render(dataset){}
    function wrapup(datasets, opts){}

    // Generate translation function xscale + given yscale
    function translate(scaleid) {
        var yscale = yscales[scaleid];
        return function(d) {
            var x = xscale.scale(xvalue(d));
            var y = yscale.scale(yvalue(d));
            return _trans(x, y);
        };
    }

    // Plot using given selection (usually a single object, but allow for array)
    function plot(sel) {
        sel.each(_plot);
    }

    // The actual work
    function _plot(data) {
        init.call(this, datasets(data));

        var svg = d3.select(this);
        var cwidth = width - padding - padding;
        var cheight = height - padding - padding;
        var gwidth = cwidth - margins.left - margins.right;
        var gheight = cheight - margins.top - margins.bottom;
        var cbottom = cheight - margins.bottom;

        // Clip for inner graphing area
        var clip = svg.append('defs')
            .append('clipPath')
                .attr('id', 'clip')
            .append('rect')
                .attr('width', gwidth)
                .attr('height', gheight);

        // Outer chart area (includes legends, axes & actual graph)
        var outer = svg.append('g');
        outer.attr('transform', _trans(padding, padding, true));
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

        // Compute horizontal & vertical scales
        // - may be more than one vertical scale if there are different units
        var left = true;
        var xvals = d3.set();
        datasets(data).forEach(function(dataset) {
            if (!xscale) {
                xscale = {
                    'xmin': Infinity,
                    'xmax': -Infinity,
                };
            }
            xscale.xmax = d3.max([xscale.xmax, xmax(dataset)]);
            xscale.xmin = d3.min([xscale.xmin, xmin(dataset)]);
            if (xscalefn().rangePoints)
                items(dataset).forEach(function(d){xvals.add(xvalue(d));});

            var scaleid = yunits(dataset);
            if (!yscales[scaleid]) {
                yscales[scaleid] = {
                    'ymin': 0,
                    'ymax': 0
                };
            }
            var yscale = yscales[scaleid];
            if (!yscale.id)
                yscale.id = scaleid;
            if (!yscale.orient)
                yscale.orient = left ? 'left' : 'right';
            left = !left;
            if (!yscale.sets)
                yscale.sets = 0;
            yscale.sets++;
            yscale.ymax = d3.max([yscale.ymax, ymax(dataset)]);
            yscale.ymin = d3.min([yscale.ymin, ymin(dataset)]);
        });

        xscale.scale = xscalefn();
        // Create actual scale & axis objects
        if (xscale.scale.rangePoints)
            xscale.scale
                .domain(xvals.values())
                .rangePoints([0, gwidth], 1);
        else
            xscale.scale
                .domain([xscale.xmin, xscale.xmax])
                .range([0, gwidth]);
        if (xscale.scale.nice && xnice)
            xscale.scale.nice(xnice);

        xscale.axis = d3.svg.axis()
            .scale(xscale.scale)
            .orient('bottom')
            .tickSize(4, 2, 1);

        for (var scaleid in yscales) {
            var scale = yscales[scaleid];
            var domain = scale.invert ? [scale.ymax, scale.ymin] : [scale.ymin, scale.ymax];
            scale.scale = yscalefn()
                .domain(domain)
                .nice()
                .range([gheight, 0]);

            scale.axis = d3.svg.axis()
                .scale(scale.scale)
                .orient(scale.orient)
                .tickSize(4, 2, 1);
        }

        // Additional processing
        var opts = {
            'padding': padding,
            'gwidth': gwidth,
            'gheight': gheight,
            'cwidth': cwidth,
            'cheight': cheight
        };

        // Render each dataset
        var series = inner.selectAll('g.dataset')
            .data(datasets(data));
        series.enter()
            .append('g')
            .attr('class', 'dataset')
            .each(render);

        // Render axes
        outer.append('g')
            .attr('class', 'xaxis')
            .attr('transform', _trans(margins.left, cbottom))
            .call(xscale.axis)
            .selectAll('line').attr('stroke', '#000');

        outer.selectAll('g.axis').data(d3.values(yscales, id)).enter()
            .append('g')
            .attr('class', 'axis')
            .attr('transform', function(d) {
                var x = d.orient == 'left' ? margins.left : cwidth - margins.right;
                var y = margins.top;
                return _trans(x, y);
            })
            .each(function(d) {
                d3.select(this)
                   .call(d.axis)
                   .selectAll('line').attr('stroke', '#000');
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
    };
    plot.xscale = function(val) {
        if (!arguments.length) return xscale;
        xscale = val;
        return plot;
    };
    plot.xscalefn = function(fn) {
        if (!arguments.length) return xscalefn;
        xscalefn = fn;
        return plot;
    };
    plot.xnice = function(val) {
        if (!arguments.length) return xnice;
        xnice = val;
        return plot;
    };
    plot.yscales = function(val) {
        if (!arguments.length) return yscales;
        yscales = val;
        return plot;
    };
    plot.yscalefn = function(fn) {
        if (!arguments.length) return yscalefn;
        yscalefn = fn;
        return plot;
    };

    // Getters/setters for accessors
    plot.id = function(fn) {
        if (!arguments.length) return id;
        id = fn;
        return plot;
    };
    plot.label = function(fn) {
        if (!arguments.length) return label;
        label = fn;
        return plot;
    };
    plot.items = function(fn) {
        if (!arguments.length) return items;
        items = fn;
        return plot;
    };
    plot.yunits = function(fn) {
        if (!arguments.length) return yunits;
        yunits = fn;
        return plot;
    };
    plot.xunits = function(fn) {
        if (!arguments.length) return xunits;
        xunits = fn;
        return plot;
    };
    plot.xvalue = function(fn) {
        if (!arguments.length) return xvalue;
        xvalue = fn;
        return plot;
    };
    plot.xmin = function(fn) {
        if (!arguments.length) return xmin;
        xmin = fn;
        return plot;
    };
    plot.xmax = function(fn) {
        if (!arguments.length) return xmax;
        xmax = fn;
        return plot;
    };
    plot.yvalue = function(fn) {
        if (!arguments.length) return yvalue;
        yvalue = fn;
        return plot;
    };
    plot.ymin = function(fn) {
        if (!arguments.length) return ymin;
        ymin = fn;
        return plot;
    };
    plot.ymax = function(fn) {
        if (!arguments.length) return ymax;
        ymax = fn;
        return plot;
    };

    // Getters/setters for render functions
    plot.init = function(fn) {
        if (!arguments.length) return init;
        init = fn;
        return plot;
    };
    plot.render = function(fn) {
        if (!arguments.length) return render;
        render = fn;
        return plot;
    };
    plot.wrapup = function(fn) {
        if (!arguments.length) return wrapup;
        wrapup = fn;
        return plot;
    };
    plot.translate = function(fn) {
        if (!arguments.length) return translate;
        translate = fn;
        return plot;
    };
    return plot;
};

// Scatter plot
chart.scatter = function() {
    var plot = chart.base(),
        cscale = d3.scale.category20(),
        legend = null;

    plot.xvalue(function(d) {
        return d.x;
    }).xunits(function(dataset) {
        return dataset.xunits;
    }).yvalue(function(d) {
        return d.y;
    }).yunits(function(dataset) {
        return dataset.yunits;
    });

    plot.init(function(datasets) {
        if (plot.legend())
            return;

        var rows = datasets.length;
        if (rows > 5) {
            plot.legend({
                'position': 'right',
                'size': 200
            });
        } else {
            plot.legend({
                'position': 'bottom',
                'size': (rows * 22 + 20)
            });
        }
    });

    function point(sid) {
        var color = cscale(sid);
        return function(sel) {
            sel.append('circle')
                .attr('r', 3)
                .attr('fill', color)
                .attr('stroke', 'black')
                .attr('cursor', 'pointer');
        };
    }

    function pointover(sid) {
        return function(d) {
            d3.select(this).selectAll('circle').attr('fill', '#9999ff');
        };
    }
    function pointout(sid) {
        return function(d) {
            d3.select(this).selectAll('circle').attr('fill', cscale(sid));
        };
    }

    plot.render(function(dataset) {
        var items     = plot.items()(dataset),
            yunits    = plot.yunits()(dataset),
            sid       = plot.id()(dataset),
            translate = plot.translate();
        d3.select(this).selectAll('g.data').data(items)
            .enter()
            .append('g')
                .attr('class', 'data')
                .attr('transform', translate(yunits))
            .call(point(sid))
            .on('mouseover', pointover(sid))
            .on('mouseout',  pointout(sid));
    });

    plot.wrapup(function(datasets, opts) {
        var svg = d3.select(this),
            outer = svg.select('g'),
            margins = plot.margins(),
            label = plot.label(),
            legendX, legendY, legendW, legendH;

        if (legend.position == 'bottom') {
             legendX = margins.left;
             legendY = opts.cheight - margins.bottom + 30;
             legendW = opts.gwidth;
             legendH = legend.size;
        } else {
             legendX = opts.cwidth - margins.right + 10;
             legendY = margins.top;
             legendW = legend.size;
             legendH = opts.gheight;
        }

        var leg = outer.append('g')
            .attr('class', 'legend')
            .attr('transform', _trans(legendX, legendY));
        leg.append('rect')
            .attr('width', legendW)
            .attr('height', legendH)
            .attr('fill', 'white')
            .attr('stroke', '#999');

        leg.selectAll('g.legenditem')
            .data(datasets)
            .enter().append('g')
                .attr('class', 'legenditem')
                .append('g')
                    .attr('class', 'data')
                    .each(function(d, i) {
                        var g = d3.select(this),
                            sid = plot.id()(d);

                        g.attr('transform', _trans(20, 20 + i * 22));
                        g.call(point(sid));
                        g.append('text')
                            .text(label(d))
                            .attr('transform', _trans(10, 5));
                    });
    });

    // Getters/setters for chart configuration
    plot.cscale = function(fn) {
        if (!arguments.length) return cscale;
        cscale = fn;
        return plot;
    };

    plot.legend = function(val) {
        if (!arguments.length) return legend;
        legend = val;
        var margins = plot.margins();
        if (legend.position == 'bottom') {
            margins.bottom = legend.size + 30;
            margins.right = 10;
        } else {
            margins.bottom = 30;
            margins.right = legend.size + 20;
        }
        plot.margins(margins);
        return plot;
    };

    return plot;
};

// Time series scatter plot
chart.timeSeries = function() {
    var plot = chart.scatter(),
        format = d3.time.format('%Y-%m-%d');

    plot.xvalue(function(d) {
        return format.parse(d.date);
    })
    .xscalefn(d3.time.scale)
    .xnice(d3.time.year)
    .yvalue(function(d) {
        return d.value;
    });

    // Getters/setters for chart configuration
    plot.timeFormat = function(val) {
        if (!arguments.length) return format;
        format = d3.time.format(val);
        return plot;
    };

    return plot;
};

// Contours (precomputed)
chart.contour = function() {
    var plot = chart.scatter();
    plot.render(function(dataset) {
        var x = plot.xvalue(),
            y = plot.yvalue(),
            yunits = plot.yunits(),
            xscale = plot.xscale().scale,
            yscale = plot.yscales()[yunits(dataset)].scale,
            cscale = plot.cscale(),
            id = plot.id(),
            items = plot.items();

        var path = d3.svg.line()
            .x(function(d) {
                return xscale(x(d));
            })
            .y(function(d) {
                return yscale(y(d));
            });

        d3.select(this).selectAll('path.contour')
           .data(items(dataset))
           .enter()
               .append('path')
               .attr('class', 'contour')
               .attr('d', path)
               .attr('fill', cscale(id(dataset)));
    });
    return plot;
};

// Box & whiskers (precomputed)
chart.boxplot = function() {
    var plot = chart.base()
        .xscalefn(d3.scale.ordinal)
        .ymin(function(dataset) {
            var items = plot.items();
            return d3.min(items(dataset), function(d) {
                return d.min;
            });
        })
        .ymax(function(dataset) {
            var items = plot.items();
            return d3.max(items(dataset), function(d) {
                return d.max;
            });
        })
        .render(function(dataset) {
            var items     = plot.items()(dataset),
                yunits    = plot.yunits()(dataset),
                yscales   = plot.yscales(),
                xscale    = plot.xscale(),
                xvalue    = plot.xvalue();

            function translate(scaleid) {
                var yscale = yscales[scaleid];
                return function(d) {
                    var x = xscale.scale(xvalue(d));
                    var y = yscale.scale(0);
                    return _trans(x, y);
                };
            }

            d3.select(this).selectAll('g.data').data(items)
                .enter()
                .append('g')
                    .attr('class', 'data')
                    .attr('transform', translate(yunits))
                .each(box(yunits));
        });

    function box(sid) {
        var yscale = plot.yscales()[sid];
        return function(d) {
            if (!d || (!d.median && !d.min && !d.max))
                return;
            function y(val) {
                return yscale.scale(val) - yscale.scale(0);
            }
            var box = d3.select(this).append('g')
                .attr('class', 'box')
                .attr('transform', _trans(-10, 0));
            box.append('line')
               .attr('x1', 0)
               .attr('x2', 20)
               .attr('y1', y(d.p25))
               .attr('y2', y(d.p25))
               .attr('stroke', '#000');
            box.append('line')
               .attr('x1', 0)
               .attr('x2', 20)
               .attr('y1', y(d.p75))
               .attr('y2', y(d.p75))
               .attr('stroke', '#000');
            box.append('line')
               .attr('x1', 0)
               .attr('x2', 20)
               .attr('y1', y(d.median))
               .attr('y2', y(d.median))
               .attr('stroke', '#000');
            box.append('line')
               .attr('x1', 0)
               .attr('x2', 0)
               .attr('y1', y(d.p25))
               .attr('y2', y(d.p75))
               .attr('stroke', '#000');
            box.append('line')
               .attr('x1', 20)
               .attr('x2', 20)
               .attr('y1', y(d.p25))
               .attr('y2', y(d.p75))
               .attr('stroke', '#000');
            box.append('line')
               .attr('x1', 5)
               .attr('x2', 15)
               .attr('y1', y(d.max))
               .attr('y2', y(d.max))
               .attr('stroke', '#000');
            box.append('line')
               .attr('x1', 5)
               .attr('x2', 15)
               .attr('y1', y(d.min))
               .attr('y2', y(d.min))
               .attr('stroke', '#000');
            box.append('line')
               .attr('x1', 10)
               .attr('x2', 10)
               .attr('y1', y(d.max))
               .attr('y2', y(d.p75))
               .attr('stroke', '#000');
            box.append('line')
               .attr('x1', 10)
               .attr('x2', 10)
               .attr('y1', y(d.min))
               .attr('y2', y(d.p25))
               .attr('stroke', '#000');
        };
    }

    return plot;
};

return chart;

});
