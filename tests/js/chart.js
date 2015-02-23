requirejs.config({
    'baseUrl': '../js'
});

define(['d3', 'wq/chart'],
function(d3, chart) {

var plot = chart.scatter();

// Initialize dataset
var data = [];
_newDataset();
data[0].list.push({
    'x': 0,
    'y': Math.random() * 100
});

// Main loop
setInterval(_update, 100);
function _update() {
    if (Math.random() > 0.97 && data.length < 12) {
        _newDataset();
    }
    if (Math.random() > 0.99) {
        _sliceDataset();
    }
    _newPoint();
    plot.xscale({
        'xmin': data[0].list[0].x,
        'xmax': data[0].list[0].x,
        'auto': true
    });
    d3.select('svg').datum(data).call(plot);
}

// Add new dataset to array
function _newDataset() {
    data.push({
        'id': 'data' + data.length,
        'label': 'Dataset ' + (data.length + 1),
        'yunits': 'Unit' + (data.length % 2 + 1),
        'list': []
    });
}

// Add point to all datasets (test switch from points to lines)
function _newPoint() {
    data.forEach(function(ds) {
        var y, last;
        if (ds.list.length) {
            last = ds.list[ds.list.length - 1];
            y = last.y - 5 + Math.random() * 10;
        } else {
            last = data[0].list[data[0].list.length - 1];
            y = Math.random() * 100 * (data.length % 2 + 1);
        }
        ds.list.push({
            'x': last.x + 1,
            'y': y
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

});
