/*!
 * wq.app 0.8.0 - wq/chart.js
 * Reusable SVG charts for analyzing time-series data.
 * (c) 2013-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

define(["d3"],
function(d3) {

var chart = {};

function _trans(x, y, off) {
    if (off) {
        x -= 0.5;
        y -= 0.5;
    }
    return 'translate(' + x + ',' + y + ')';
}

function _selectOrAppend(sel, name, cls) {
    var selector = name;
    if (cls) {
        selector += "." + cls;
    }
    var elem = sel.select(selector);
    if (elem.empty()) {
        elem = sel.append(name);
        if (cls) {
            elem.attr('class', cls);
        }
    }
    return elem;
}

// General chart configuration
chart.base = function() {
    var width=700, height=300, padding=7.5,
        marginGroups = {
            'padding': {'left': 10, 'right': 10, 'top': 10, 'bottom': 10},
            'xaxis': {'bottom': 20}
        },
        viewBox=true,
        nestedSvg=false,
        renderBackground = false,
        xscale = null,
        xscalefn = d3.scale.linear,
        xnice = null,
        xticks = null,
        yscales = {},
        yscalefn = d3.scale.linear,
        cscale = d3.scale.category20(),
        outerFill = '#f3f3f3',
        innerFill = '#eee',
        legend = null,
        leftYAxis = true;

    // Accessors for entire data object
    function datasets(d) {
        if (d.data) {
            return d.data;
        }
        return d;
    }
    function legendItems(d) {
        return datasets(d);
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
    function legendItemId(d) {
        return id(d);
    }
    function legendItemLabel(d) {
        return label(d);
    }

    function xunits(dataset) {
        /* jshint unused: false */
        throw "xunits accessor not defined!";
    }
    function xmax(dataset) {
        return d3.max(items(dataset), xvalue);
    }
    function xmin(dataset) {
        return d3.min(items(dataset), xvalue);
    }
    function xset(d) {
        var xvals = d3.set();
        datasets(d).forEach(function(dataset) {
            items(dataset).forEach(function(d) {
                xvals.add(xvalue(d));
            });
        });
        return xvals.values().map(function(d) {
            return isNaN(+d) ? d : +d;
        });
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
    function xvalue(d) {
        /* jshint unused: false */
        throw "xvalue accessor not defined!";
    }
    function yvalue(d) {
        /* jshint unused: false */
        throw "yvalue accessor not defined!";
    }
    function xscaled(d) {
        return xscale.scale(xvalue(d));
    }
    function yscaled(scaleid) {
        var yscale = yscales[scaleid];
        return function(d) {
            return yscale.scale(yvalue(d));
        };
    }
    function itemid(d) {
        return xvalue(d) + "=" + yvalue(d);
    }

    // Rendering functions (should be overridden)
    function init(datasets, opts) {
        /* jshint unused: false */
    }
    function render(dataset) {
        /* jshint unused: false */
    }
    function wrapup(datasets, opts) {
        /* jshint unused: false */
    }

    // Legend item rendering
    function legendItemShape(sid) {
        /* jshint unused: false */
        return "rect";
    }
    function legendItemStyle(sid) {
        return rectStyle(sid);
    }
    function rectStyle(sid) {
        var color = cscale(sid);
        return function(sel) {
            sel.attr('x', -3)
                .attr('y', -3)
                .attr('width', 6)
                .attr('height', 6)
                .attr('fill', color);
        };
    }
    function circleStyle(sid) {
        var color = cscale(sid);
        return function(sel) {
            sel.attr('r', 3)
                .attr('fill', color)
                .attr('stroke', 'black')
                .attr('stroke-width', 0.2)
                .attr('cursor', 'pointer');
        };
    }


    // Generate translation function xscale + given yscale
    function translate(scaleid) {
        var yfn = yscaled(scaleid);
        return function(d) {
            var x = xscaled(d);
            var y = yfn(d);
            return _trans(x, y);
        };
    }

    // Plot using given selection (usually one object, but wrapped as array)
    function plot(sel) {
        if (nestedSvg) {
            sel = _selectOrAppend(sel, 'svg', nestedSvg);
        }
        sel.each(_plot);
    }

    // The actual work
    function _plot(data) {
        if (legend === null || legend.auto) {
            _positionLegend.call(this, legendItems(data));
        }
        _computeScales(datasets(data));
        var ordinal = xscalefn().rangePoints || false;
        var svg = d3.select(this);
        var uid = svg.attr('data-wq-uid') || Math.round(
            Math.random() * 1000000
        );
        svg.attr('data-wq-uid', uid);
        var vbstr;
        if (viewBox) {
            if (viewBox === true) {
                vbstr = "0 0 " + width + " " + height;
            } else {
                vbstr = viewBox;
            }
            svg.attr("viewBox", vbstr);
        }
        var cwidth = width - padding - padding;
        var cheight = height - padding - padding;
        var margins = plot.getMargins();
        var gwidth = cwidth - margins.left - margins.right;
        var gheight = cheight - margins.top - margins.bottom;
        var cbottom = cheight - margins.bottom;
        var opts = {
            'padding': padding,
            'gwidth': gwidth,
            'gheight': gheight,
            'cwidth': cwidth,
            'cheight': cheight
        };
        init.call(this, datasets(data), opts);

        // Clip for inner graphing area
        var clipId = "clip" + uid;
        var defs = _selectOrAppend(svg, 'defs');

        // Webkit can't select clipPath #83438
        var clip = defs.select('#' + clipId);

        if (clip.empty()) {
            clip = defs.append('clipPath').attr('id', clipId);
            clip.append('rect');
        }
        clip.select('rect')
            .attr('width', gwidth)
            .attr('height', gheight);

        // Outer chart area (includes legends, axes & actual graph)
        var outer = _selectOrAppend(svg, 'g', 'outer');
        outer.attr('transform', _trans(padding, padding, true));
        _selectOrAppend(outer, 'rect')
            .attr('width', cwidth)
            .attr('height', cheight)
            .attr('fill', outerFill);

        // Inner graphing area (clipped)
        var inner = _selectOrAppend(outer, 'g', 'inner')
            .attr('clip-path', 'url(#' + clipId + ')')
            .attr('transform', _trans(margins.left, margins.top));
        _selectOrAppend(inner, 'rect')
            .attr('width', gwidth)
            .attr('height', gheight)
            .attr('fill', innerFill);


        // Create actual scale & axis objects
        xscale.scale = xscalefn();
        if (ordinal) {
            xscale.scale
                .domain(xset(data).sort(d3.ascending))
                .rangePoints([0, gwidth], 1);
        } else {
            xscale.scale
                .domain([xscale.xmin, xscale.xmax])
                .range([0, gwidth]);
        }
        if (xscale.scale.nice && xnice) {
            xscale.scale.nice(xnice);
        }

        xscale.axis = d3.svg.axis()
            .scale(xscale.scale)
            .orient('bottom')
            .tickSize(4, 2, 1);
        if (xticks) {
            xscale.axis.ticks(xticks);
        }

        for (var scaleid in yscales) {
            var scale = yscales[scaleid];
            var domain;
            if (scale.invert) {
                domain = [scale.ymax, scale.ymin];
            } else {
                domain = [scale.ymin, scale.ymax];
            }
            scale.scale = yscalefn()
                .domain(domain)
                .nice()
                .range([gheight, 0]);

            scale.axis = d3.svg.axis()
                .scale(scale.scale)
                .orient(scale.orient)
                .tickSize(4, 2, 1);
        }

        // Render each dataset
        if (renderBackground) {
            var background = _selectOrAppend(inner, 'g', 'background')
               .selectAll('g.dataset-background')
               .data(datasets(data), id);
            background.enter()
                .append('g')
                .attr('class', 'dataset-background');
            background.exit().remove();
            background.each(renderBackground);
        }
        var series = _selectOrAppend(inner, 'g', 'datasets')
            .selectAll('g.dataset')
            .data(datasets(data), id);
        series.enter()
            .append('g')
            .attr('class', 'dataset');
        series.exit().remove();
        series.each(render);

        // Render axes
        _selectOrAppend(outer, 'g', 'xaxis')
            .attr('transform', _trans(margins.left, cbottom))
            .call(xscale.axis)
            .selectAll('line').attr('stroke', '#000');

        var yaxes = outer.selectAll('g.axis')
            .data(d3.values(yscales), function(s){ return s.id; });
        yaxes.enter().append('g').attr('class', 'axis');
        yaxes.exit().remove();
        yaxes.attr('transform', function(d) {
                var x;
                if (d.orient == 'left') {
                    x = margins.left;
                } else {
                    x = cwidth - margins.right;
                }
                var y = margins.top;
                return _trans(x, y);
            })
            .each(function(d) {
                d3.select(this)
                   .call(d.axis)
                   .selectAll('line').attr('stroke', '#000');
            });

        if (legend && legend.position) {
            _renderLegend.call(this, legendItems(data), opts);
        } else {
            outer.select('g.legend').remove();
        }
        wrapup.call(this, datasets(data), opts);
    }

    function _positionLegend(items) {
        var rows = items.length;
        if (rows > 5) {
            plot.legend({
                'position': 'right',
                'size': 150,
                'auto': true
            });
        } else {
            plot.legend({
                'position': 'bottom',
                'size': (rows * 22 + 20),
                'auto': true
            });
        }
    }

    // Compute horizontal & vertical scales
    // - may be more than one vertical scale if there are different units
    function _computeScales(datasets) {
        datasets.forEach(function(dataset) {
            if (!xscale) {
                xscale = {
                    'xmin': Infinity,
                    'xmax': -Infinity,
                    'auto': true
                };
            }
            if (xscale.auto) {
                xscale.xmax = d3.max([xscale.xmax, xmax(dataset)]);
                xscale.xmin = d3.min([xscale.xmin, xmin(dataset)]);
            }

            var scaleid = yunits(dataset);
            if (!yscales[scaleid]) {
                yscales[scaleid] = {
                    'ymin': 0,
                    'ymax': 0,
                    'auto': true
                };
            }
            var yscale = yscales[scaleid];
            if (!yscale.id) {
                yscale.id = scaleid;
            }
            if (!yscale.orient) {
                yscale.orient = leftYAxis ? 'left' : 'right';
                leftYAxis = !leftYAxis;
            }
            if (!yscale.sets) {
                yscale.sets = 0;
            }
            yscale.sets++;
            if (yscale.auto) {
                yscale.ymax = d3.max([yscale.ymax, ymax(dataset)]);
                yscale.ymin = d3.min([yscale.ymin, ymin(dataset)]);
            }
        });
        var ymargin = {'left': 70};
        if (d3.keys(yscales).length > 1) {
            ymargin.right = 70;
        }
        plot.setMargin('yaxis', ymargin);
    }

    function _renderLegend(items, opts) {
        var svg = d3.select(this),
            outer = svg.select('g.outer'),
            margins = plot.getMargins(),
            legendX, legendY, legendW, legendH;

        if (legend.position == 'bottom') {
            legendX = margins.left;
            legendY = opts.cheight - margins.bottom + 30;
            legendW = opts.gwidth;
            legendH = legend.size;
        } else {
            legendX = opts.cwidth - legend.size - 10;
            legendY = margins.top;
            legendW = legend.size;
            legendH = opts.gheight;
        }

        var leg = _selectOrAppend(outer, 'g', 'legend')
            .attr('transform', _trans(legendX, legendY));
        _selectOrAppend(leg, 'rect')
            .attr('width', legendW)
            .attr('height', legendH)
            .attr('fill', 'white')
            .attr('stroke', '#999');

        var legitems = leg.selectAll('g.legenditem')
            .data(items, legendItemId);
        var newitems = legitems.enter().append('g')
            .attr('class', 'legenditem')
            .append('g')
                .attr('class', 'data');
        newitems.each(function(d) {
            var g = d3.select(this),
                sid = legendItemId(d);
            g.append(legendItemShape(sid));
            g.append('text');
        });
        legitems.exit().remove();
        legitems.each(function(d, i) {
            var g = d3.select(this).select('g.data'),
                sid = legendItemId(d);
            g.attr('transform', _trans(20, 20 + i * 22));
            g.select(legendItemShape(sid)).call(legendItemStyle(sid));
            g.select('text')
                .text(legendItemLabel(d))
                .attr('transform', _trans(10, 5));
        });
    }

    // Getters/setters for chart configuration
    plot.width = function(val) {
        if (!arguments.length) {
            return width;
        }
        width = val;
        return plot;
    };
    plot.height = function(val) {
        if (!arguments.length) {
            return height;
        }
        height = val;
        return plot;
    };
    plot.viewBox = function(val) {
        if (!arguments.length) {
            return viewBox;
        }
        viewBox = val;
        return plot;
    };
    plot.nestedSvg = function(val) {
        if (!arguments.length) {
            return nestedSvg;
        }
        nestedSvg = val;
        return plot;
    };
    plot.outerFill = function(val) {
        if (!arguments.length) {
            return outerFill;
        }
        outerFill = val;
        return plot;
    };
    plot.innerFill = function(val) {
        if (!arguments.length) {
            return innerFill;
        }
        innerFill = val;
        return plot;
    };
    plot.legend = function(val) {
        if (!arguments.length) {
            return legend;
        }
        legend = val || {};
        var lmargin = {};
        if (legend.position == 'bottom') {
            lmargin.bottom = legend.size + 10;
        } else if (legend.position == 'right') {
            lmargin.right = legend.size + 10;
        }

        plot.setMargin('legend', lmargin);
        return plot;
    };
    plot.xscale = function(val) {
        if (!arguments.length) {
            return xscale;
        }
        xscale = val;
        return plot;
    };
    plot.xscalefn = function(fn) {
        if (!arguments.length) {
            return xscalefn;
        }
        xscalefn = fn;
        return plot;
    };
    plot.xscaled = function(fn) {
        if (!arguments.length) {
            return xscaled;
        }
        xscaled = fn;
        return plot;
    };
    plot.xnice = function(val) {
        if (!arguments.length) {
            return xnice;
        }
        xnice = val;
        return plot;
    };
    plot.xticks = function(val) {
        if (!arguments.length) {
            return xticks;
        }
        xticks = val;
        return plot;
    };
    plot.yscales = function(val) {
        if (!arguments.length) {
            return yscales;
        }
        yscales = val;
        return plot;
    };
    plot.yscalefn = function(fn) {
        if (!arguments.length) {
            return yscalefn;
        }
        yscalefn = fn;
        return plot;
    };
    plot.yscaled = function(fn) {
        if (!arguments.length) {
            return yscaled;
        }
        yscaled = fn;
        return plot;
    };
    plot.cscale = function(fn) {
        if (!arguments.length) {
            return cscale;
        }
        cscale = fn;
        return plot;
    };

    // Getters/setters for accessors
    plot.datasets = function(fn) {
        if (!arguments.length) {
            return datasets;
        }
        datasets = fn;
        return plot;
    };
    plot.id = function(fn) {
        if (!arguments.length) {
            return id;
        }
        id = fn;
        return plot;
    };
    plot.label = function(fn) {
        if (!arguments.length) {
            return label;
        }
        label = fn;
        return plot;
    };
    plot.legendItems = function(fn) {
        if (!arguments.length) {
            return legendItems;
        }
        legendItems = fn;
        return plot;
    };
    plot.legendItemId = function(fn) {
        if (!arguments.length) {
            return legendItemId;
        }
        legendItemId = fn;
        return plot;
    };
    plot.legendItemLabel = function(fn) {
        if (!arguments.length) {
            return legendItemLabel;
        }
        legendItemLabel = fn;
        return plot;
    };
    plot.items = function(fn) {
        if (!arguments.length) {
            return items;
        }
        items = fn;
        return plot;
    };
    plot.yunits = function(fn) {
        if (!arguments.length) {
            return yunits;
        }
        yunits = fn;
        return plot;
    };
    plot.xunits = function(fn) {
        if (!arguments.length) {
            return xunits;
        }
        xunits = fn;
        return plot;
    };
    plot.xvalue = function(fn) {
        if (!arguments.length) {
            return xvalue;
        }
        xvalue = fn;
        return plot;
    };
    plot.xmin = function(fn) {
        if (!arguments.length) {
            return xmin;
        }
        xmin = fn;
        return plot;
    };
    plot.xmax = function(fn) {
        if (!arguments.length) {
            return xmax;
        }
        xmax = fn;
        return plot;
    };
    plot.xset = function(fn) {
        if (!arguments.length) {
            return xset;
        }
        xset = fn;
        return plot;
    };
    plot.yvalue = function(fn) {
        if (!arguments.length) {
            return yvalue;
        }
        yvalue = fn;
        return plot;
    };
    plot.ymin = function(fn) {
        if (!arguments.length) {
            return ymin;
        }
        ymin = fn;
        return plot;
    };
    plot.ymax = function(fn) {
        if (!arguments.length) {
            return ymax;
        }
        ymax = fn;
        return plot;
    };
    plot.itemid = function(fn) {
        if (!arguments.length) {
            return itemid;
        }
        itemid = fn;
        return plot;
    };

    // Getters/setters for render functions
    plot.init = function(fn) {
        if (!arguments.length) {
            return init;
        }
        init = fn;
        return plot;
    };
    plot.renderBackground = function(fn) {
        if (!arguments.length) {
            return renderBackground;
        }
        renderBackground = fn;
        return plot;
    };
    plot.render = function(fn) {
        if (!arguments.length) {
            return render;
        }
        render = fn;
        return plot;
    };
    plot.wrapup = function(fn) {
        if (!arguments.length) {
            return wrapup;
        }
        wrapup = fn;
        return plot;
    };
    plot.translate = function(fn) {
        if (!arguments.length) {
            return translate;
        }
        translate = fn;
        return plot;
    };
    plot.legendItemShape = function(fn) {
        if (!arguments.length) {
            return legendItemShape;
        }
        legendItemShape = fn;
        return plot;
    };
    plot.legendItemStyle = function(fn) {
        if (!arguments.length) {
            return legendItemStyle;
        }
        legendItemStyle = fn;
        return plot;
    };
    plot.rectStyle = function(fn) {
        if (!arguments.length) {
            return rectStyle;
        }
        rectStyle = fn;
        return plot;
    };
    plot.circleStyle = function(fn) {
        if (!arguments.length) {
            return circleStyle;
        }
        circleStyle = fn;
        return plot;
    };


    // Inner margin has separate getter and setter as it is composed of a
    // number of individually-set components
    plot.setMargin = function(name, offsets) {
        marginGroups[name] = offsets;
        return plot;
    };

    plot.getMargins = function() {
        var margins = {
            'left': 0,
            'right': 0,
            'top': 0,
            'bottom': 0
        };
        for (var name in marginGroups) {
            for (var dir in marginGroups[name]) {
                var val = marginGroups[name][dir];
                if (val) {
                    margins[dir] += val;
                }
            }
        }
        return margins;
    };

    return plot;
};

// Scatter plot
chart.scatter = function() {
    var plot = chart.base(), pointStyle = plot.circleStyle();

    plot.xvalue(function(d) {
        return d.x;
    }).xunits(function(dataset) {
        return dataset.xunits;
    }).yvalue(function(d) {
        return d.y;
    }).yunits(function(dataset) {
        return dataset.yunits;
    }).legendItemShape(function(sid) {
        return pointShape(sid);
    }).legendItemStyle(function(sid) {
        return pointStyle(sid);
    });

    /* To customize points beyond just the color, override these functions */
    function pointShape(sid) {
        /* jshint unused: false */
        return "circle";
    }
    // pointStyle function is initialized above

    /* To customize lines beyond just the color, override this function */
    function lineStyle(sid) {
        var color = plot.cscale()(sid);
        return function(sel) {
            sel.attr('stroke', color);
        };
    }

    function pointover(sid) {
        /* jshint unused: false */
        return function(d) {
            d3.select(this).selectAll(pointShape(sid))
                .attr('fill', '#9999ff');
        };
    }
    function pointout(sid) {
        /* jshint unused: false */
        return function(d) {
            d3.select(this).selectAll(pointShape(sid))
               .attr('fill', plot.cscale()(sid));
        };
    }
    function pointLabel(sid) {
        var x = plot.xvalue(),
            y = plot.yvalue();
        return function(d) {
            return sid + " at " + x(d) + ": " + y(d);
        };
    }
    function drawPointsIf(dataset) {
        var items = plot.items()(dataset);
        return items && items.length <= 50;
    }
    function drawLinesIf(dataset){
        var items = plot.items()(dataset);
        return items && items.length > 50;
    }

    // Render lines in background to ensure all points are above them
    plot.renderBackground(function(dataset) {
        var items   = plot.items()(dataset),
            yunits  = plot.yunits()(dataset),
            sid     = plot.id()(dataset),
            xscaled = plot.xscaled(),
            yscaled = plot.yscaled()(yunits),
            g       = d3.select(this),
            path    = g.select('path.data'),
            line    = d3.svg.line()
                        .x(xscaled)
                        .y(yscaled);
        if (!drawLinesIf(dataset)) {
            path.remove();
            return;
        }
        // Generate path element for new datasets
        if (path.empty()) {
            path = g.append('path')
                .attr('class', 'data')
                .attr('fill', 'transparent');
        }
        // Update path for new and existing datasets
        path.datum(items)
            .attr('d', line)
            .call(lineStyle(sid));
    });

    plot.render(function(dataset) {
        var items     = plot.items()(dataset),
            yunits    = plot.yunits()(dataset),
            sid       = plot.id()(dataset),
            translate = plot.translate(),
            g         = d3.select(this),
            points, newpoints;

        if (!drawPointsIf(dataset)) {
            g.selectAll('g.data').remove();
            return;
        }
        points = g.selectAll('g.data').data(items, plot.itemid());

        // Generate elements for new data
        newpoints = points.enter().append('g')
            .attr('class', 'data');
        newpoints.append(pointShape(sid));
        newpoints.append('title');

        points.exit().remove();

        // Update elements for new or existing data
        points.on('mouseover', pointover(sid))
            .on('mouseout',  pointout(sid));
        points.attr('transform', translate(yunits));
        points.select(pointShape(sid)).call(pointStyle(sid));
        points.select('title').text(pointLabel(sid));
    });

    // Getters/setters for chart configuration
    plot.pointShape = function(fn) {
        if (!arguments.length) {
            return pointShape;
        }
        pointShape = fn;
        return plot;
    };

    plot.pointStyle = function(fn) {
        if (!arguments.length) {
            return pointStyle;
        }
        pointStyle = fn;
        return plot;
    };

    plot.lineStyle = function(fn) {
        if (!arguments.length) {
            return lineStyle;
        }
        lineStyle = fn;
        return plot;
    };

    plot.pointover = function(fn) {
        if (!arguments.length) {
            return pointover;
        }
        pointover = fn;
        return plot;
    };

    plot.pointout = function(fn) {
        if (!arguments.length) {
            return pointout;
        }
        pointout = fn;
        return plot;
    };

    plot.pointLabel = function(fn) {
        if (!arguments.length) {
            return pointLabel;
        }
        pointLabel = fn;
        return plot;
    };

    plot.drawPointsIf = function(fn) {
        if (!arguments.length) {
            return drawPointsIf;
        }
        drawPointsIf = fn;
        return plot;
    };

    plot.drawLinesIf = function(fn) {
        if (!arguments.length) {
            return drawLinesIf;
        }
        drawLinesIf = fn;
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
    })
    .yunits(function(d) {
        return d.units;
    })
    .pointLabel(function(sid) {
        var x = plot.xvalue(),
            y = plot.yvalue();
        return function(d) {
            return sid + " on " + format(x(d)) + ": " + y(d);
        };
    });

    // Getters/setters for chart configuration
    plot.timeFormat = function(val) {
        if (!arguments.length) {
            return format;
        }
        format = d3.time.format(val);
        return plot;
    };

    return plot;
};

// Contours (precomputed)
chart.contour = function() {
    var plot = chart.scatter();

    plot.legendItemShape(function(sid) {
        /* jshint unused: false */
        return 'rect';
    }).legendItemStyle(
        plot.rectStyle()
    );

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

        var contours = d3.select(this).selectAll('path.contour')
           .data(items(dataset), id);
        contours.enter()
           .append('path')
           .attr('class', 'contour');
        contours.exit().remove();
        contours.attr('d', path)
           .attr('fill', cscale(id(dataset)));
    });
    return plot;
};

// Box & whiskers (precomputed)
chart.boxplot = function() {
    var plot = chart.base(), r, wr, offsets = {};
    plot.xscalefn(d3.scale.ordinal)
        .itemid(function(d) { return plot.xvalue()(d); })
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
        .init(function(datasets, opts) {
            var step = plot.xset()(datasets).length; // Number of x axis labels
            var slots = step * (datasets.length + 1); // ~How many boxes to fit
            var space = opts.gwidth / slots; // Space available for each box
            r = d3.min([space * 0.8 / 2, 20]); // "radius" of box (use 80%)
            wr = r / 2; // "radius" of whiskers
            var width = (datasets.length - 1) * space;
            datasets.forEach(function(dataset, i) {
                offsets[plot.id()(dataset)] = i * space - width / 2;
            });
        })
        .render(function(dataset) {
            var items     = plot.items()(dataset),
                yunits    = plot.yunits()(dataset),
                sid       = plot.id()(dataset),
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

            var boxes = d3.select(this).selectAll('g.data').data(
                items, plot.itemid()
            );
            boxes.enter().append('g').attr('class', 'data');
            boxes.exit().remove();
            boxes.attr('transform', translate(yunits))
                .each(box(sid, yunits));
        });

    function box(sid, yunits) {
        var yscale = plot.yscales()[yunits];
        var color = plot.cscale()(sid);
        return function(d) {
            if (!d || (!d.median && !d.min && !d.max)) {
                return;
            }
            function y(val) {
                return yscale.scale(val) - yscale.scale(0);
            }

            var box = _selectOrAppend(d3.select(this), 'g', 'box')
                .attr('transform', _trans(offsets[sid], 0));
            _selectOrAppend(box, 'line', 'p25')
               .attr('x1', -r)
               .attr('x2', r)
               .attr('y1', y(d.p25))
               .attr('y2', y(d.p25))
               .attr('stroke-width', 2)
               .attr('stroke', color);
            _selectOrAppend(box, 'line', 'p75')
               .attr('x1', -r)
               .attr('x2', r)
               .attr('y1', y(d.p75))
               .attr('y2', y(d.p75))
               .attr('stroke-width', 2)
               .attr('stroke', color);
            _selectOrAppend(box, 'line', 'median')
               .attr('x1', -r)
               .attr('x2', r)
               .attr('y1', y(d.median))
               .attr('y2', y(d.median))
               .attr('stroke-width', 2)
               .attr('stroke', color);
            _selectOrAppend(box, 'line', 'iqr-left')
               .attr('x1', -r)
               .attr('x2', -r)
               .attr('y1', y(d.p25))
               .attr('y2', y(d.p75))
               .attr('stroke-width', 2)
               .attr('stroke', color);
            _selectOrAppend(box, 'line', 'iqr-right')
               .attr('x1', r)
               .attr('x2', r)
               .attr('y1', y(d.p25))
               .attr('y2', y(d.p75))
               .attr('stroke-width', 2)
               .attr('stroke', color);
            _selectOrAppend(box, 'line', 'w-top')
               .attr('x1', -wr)
               .attr('x2', wr)
               .attr('y1', y(d.max))
               .attr('y2', y(d.max))
               .attr('stroke', color);
            _selectOrAppend(box, 'line', 'w-bottom')
               .attr('x1', -wr)
               .attr('x2', wr)
               .attr('y1', y(d.min))
               .attr('y2', y(d.min))
               .attr('stroke', color);
            _selectOrAppend(box, 'line', 'w-p75')
               .attr('x1', 0)
               .attr('x2', 0)
               .attr('y1', y(d.max))
               .attr('y2', y(d.p75))
               .attr('stroke', color);
            _selectOrAppend(box, 'line', 'w-p25')
               .attr('x1', 0)
               .attr('x2', 0)
               .attr('y1', y(d.min))
               .attr('y2', y(d.p25))
               .attr('stroke', color);
        };
    }

    return plot;
};

return chart;

});
