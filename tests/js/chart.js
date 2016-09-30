requirejs.config({
    'baseUrl': '../js'
});

define(['d3', 'wq/chart'],
function(d3, chart) {

var timeSeriesPlot = chart.timeSeries(),
    scatterPlot = chart.scatter()
        .cscale(d3.scaleOrdinal(d3.schemeCategory10)),
    boxPlot = chart.boxplot()
        .xvalue(function(d) { return d.year; });

// Initialize dataset
var data = [],
    sdata = [],
    bdata = [],
    parse = d3.timeParse('%Y-%m-%d'),
    format = d3.timeFormat('%Y-%m-%d');
_newDataset();
data[0].list.push({
    'date': (new Date()).getFullYear() + '-01-01',
    'value': Math.random() * 100
});

// Main loop
var anim;
_update();
function _update() {
    if (Math.random() > 0.97 && data.length < 12) {
        _newDataset();
    }
    if (Math.random() > 0.995) {
        _sliceDataset();
    }
    _newPoint();
    _computeXY();
    _computeBoxPlots();
    d3.select('svg#timeSeries').datum(data).call(timeSeriesPlot);

    if (sdata.length) {
        scatterPlot.xscale({
            'xmin': sdata[0].list[0].x,
            'xmax': sdata[0].list[0].x,
            'auto': true
        });
        d3.select('svg#scatter').datum(sdata).call(scatterPlot);
    }

    if (bdata.length) {
        d3.select('svg#boxplot').datum(bdata).call(boxPlot);
    }
}

d3.select('button').on('click', function() {
    if (anim) {
        clearInterval(anim);
        anim = null;
        this.innerHTML = "Start";
    } else {
        anim = setInterval(_update, 100);
        this.innerHTML = "Pause";
    }
});

// Add new dataset to array
function _newDataset() {
    data.push({
        'id': 'data' + data.length,
        'label': 'Dataset ' + (data.length + 1),
        'units': 'Unit' + (data.length % 2 + 1),
        'intercept': Math.random() * 100,
        'list': []
    });
}

// Add point to all datasets (test switch from points to lines)
function _newPoint() {
    data.forEach(function(ds, i) {
        var value, last, date, ratio;
        if (i % 2 == 1) {
            ratio = ds.lastRatio || Math.random() * 4 - 2;
            while (Math.abs(ratio) < 0.1) {
                ratio *= 2;
            }
            ratio += (0.05 * Math.random() * ratio) - 0.025 * ratio;
            last = data[i - 1].list[data[i - 1].list.length - 1];
            value = last.value * ratio - 5 + Math.random() * 10 + ds.intercept;
            date = last.date;
            ds.lastRatio = ratio;
        } else {
            if (ds.list.length) {
                last = ds.list[ds.list.length - 1];
                value = last.value - 5 + Math.random() * 10;
            } else {
                last = data[0].list[data[0].list.length - 1];
                value = Math.random() * 100 * (data.length % 2 + 1);
            }
            date = parse(last.date);
            date.setDate(date.getDate() + 1);
            date = format(date);
        }
        ds.list.push({
            'date': date,
            'value': value
        });
    });
}

// Truncate a dataset (test switch from lines back to points)
function _sliceDataset() {
    var ds = data[Math.floor(Math.random() * data.length)];
    if (ds.list.length > 50) {
        ds.list = ds.list.slice(ds.list.length-1);
    }
}

function _computeXY() {
    var i, j, xoffset, yoffset, xds, yds, xy;
    sdata = [];
    for (i = 0; i < data.length; i += 2) {
        xds = data[i];
        yds = data[i + 1];
        if (!yds) {
            continue;
        }
        xoffset = 0;
        while (xoffset < xds.list.length &&
               xds.list[xoffset].date < yds.list[0].date) {
            xoffset++;
        }
        yoffset = 0;
        while (yoffset < yds.list.length &&
               yds.list[yoffset].date < xds.list[0].date) {
            yoffset++;
        }

        j = 0;
        xy = {
            'id': 'compare' + sdata.length,
            'label': xds.label + ' vs. ' + yds.label,
            'yunits': yds.units,
            'list': []
        };
        while (j + xoffset < xds.list.length &&
               j + yoffset < yds.list.length) {
            xy.list.push({
                'x': xds.list[j + xoffset].value,
                'y': yds.list[j + yoffset].value
            });
            j++;
        }
        if (xy.list.length > 0) {
            xy.list.sort(function(a, b) {
                return d3.ascending(a.x, b.x);
            });
            sdata.push(xy);
        }
    }
}

function _computeBoxPlots() {
    bdata = [];
    data.forEach(function(ds) {
        var years = {};
        ds.list.forEach(function(d) {
            var year = d.date.split('-')[0];
            if (!years[year]) {
                years[year] = [];
            }
            years[year].push(d.value);
        });
        bdata.push({
            'id': ds.id,
            'label': ds.label,
            'units': ds.units,
            'list': Object.keys(years).map(function(year) {
                var vals = years[year].sort(d3.ascending);
                return {
                    'year': year,
                    'value-whislo': d3.min(vals),
                    'value-q1': d3.quantile(vals, 0.25),
                    'value-med': d3.median(vals),
                    'value-q3': d3.quantile(vals, 0.75),
                    'value-whishi': d3.max(vals)
                };
            })
        });
    });
}

});
