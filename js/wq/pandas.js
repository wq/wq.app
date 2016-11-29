/*
 * wq.app 1.0.0-dev - wq/pandas.js
 * Load and parse CSV with complex headers (e.g. from pandas DataFrames)
 * (c) 2014-2016, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['d3'], function(d3) {

var pandas = {};

pandas.parse = function(str) {
    /* Parses a CSV string with the following structure:

    ,value,value,value              // values header
    site,SITE1,SITE2,SITE3          // meta header #1 (site)
    parameter,PARAM1,PARAM1,PARAM2  // meta header #2 (parameter)
    date,,,                         // id columns header
    2014-01-01,0.5,0.5,0.2          // data row
    2014-01-02,0.1,0.5,0.2          // " "

    Into an array of datasets with the following structure:
    [
        {
            'site': 'SITE1',
            'parameter': 'PARAM1',
            'data': [
                {'date': '2014-01-01', 'value': 0.5},
                {'date': '2014-01-02', 'value': 0.1}
            ]
        }
        // etc for SITE2/PARAM1 and SITE3/PARAM2...
    ]


    Also supports multi-valued datasets, e.g.:

    ,val1,val2
    site,SITE1,SITE1,
    parameter,PARAM1,PARAM1
    date,,
    2014-01-01,0.6,0.3

    Will be parsed into:
    [
        {
            'site': 'SITE1',
            'parameter': 'PARAM1',
            'data': [
                {'date': '2014-01-01', 'val1': 0.6, 'val2': 0.3}
            ]
        }
    ]

    */

    var idColumns, metadata = [], datasets = [], col2dataset = [], data,
        valuesHeader, rows;
    if (str.charAt(0) != ',') {
        // Assume plain CSV (single series with one-row header)
        data = [];
        d3.csvParse(str).forEach(function(row) {
            var key, val;
            for (key in row) {
                val = row[key];
                row[key] = val.length>0 ? (isNaN(+val) ? val : +val) : '';
            }
            data.push(row);
        });
        return [{
            'data': data
        }];
    }

    // Parse CSV headers and data
    rows = d3.csvParseRows(str);
    rows.forEach(function(row, i) {
        if (data) {
            parseData(row);
        } else if (i === 0 && row[0] === "") {
            parseValuesHeader(row);
        } else if (valuesHeader && row[row.length - 1] !== "") {
            parseMetaHeader(row);
        } else if (valuesHeader) {
            parseIdHeader(row);
            findDatasets();
            data = true;
        } else {
            parseSimpleHeader(row);
            data = true;
        }
    });

    function parseValuesHeader(row) {
        // Blank first column => this row has value column labels
        valuesHeader = row;
    }

    function parseMetaHeader(row) {
        // First & last column aren't blank => this row contains metadata
        var metaname = row[0];
        var metaStart = valuesHeader.lastIndexOf("") + 1;
        row.slice(metaStart).forEach(function(d, i) {
            if (!metadata[i]) {
                metadata[i] = {};
            }
            metadata[i][metaname] = d;
        });
    }

    function parseIdHeader(row) {
        // Blank last column => this row has index column labels
        if (row.indexOf("") != valuesHeader.lastIndexOf("") + 1) {
            throw "Header mismatch!";
        }
        idColumns = row.slice(0, row.indexOf(""));

    }

    function findDatasets() {
        // Ensure that datasets[] has only one entry for each dataset, as
        // datasets that may span multiple columns.  Hash the metadata values
        // to get a unique key.
        var datasetIndex = {};
        metadata.forEach(function(meta, i) {
            var metaHash = hash(meta);
            var index = datasetIndex[metaHash];
            if (index === undefined) {
                index = datasets.length;
                datasetIndex[metaHash] = index;
                meta.data = [];
                datasets.push(meta);
            }
            col2dataset[i] = index;
        });
    }

    function parseSimpleHeader(row) {
        // No values header found, assume single-row header
        // - first column is row id (i.e. date)
        // - all other columns are individual timeseries
        // - (if parsing a single multi-valued timeseries, just use d3.csv)
        idColumns = [row[0]];
        valuesHeader = [];
        row.slice(1).forEach(function(s, i) {
            datasets[i] = {'id': s, 'data': []};
            col2dataset[i] = i;
            valuesHeader[i + 1] = "value";
        });
    }

    function parseData(row) {
        // Parse a row of data, using header information as appropriate
        var id = {};
        idColumns.forEach(function(c, i) {
            id[c] = row[i];
        });

        var rowdata = [];
        row.slice(idColumns.length).forEach(function(d, i) {
            var c, item, dsi, valname;
            if (d === "") {
                return;
            }
            dsi = col2dataset[i];
            valname = valuesHeader[i + idColumns.length];
            item = rowdata[dsi];
            if (!item) {
                item = {};
                for (c in id) {
                    item[c] = id[c];
                }
                rowdata[dsi] = item;
            }
            item[valname] = isNaN(+d) ? d : +d;
        });
        rowdata.forEach(function(d, i) {
            datasets[i].data.push(d);
        });
    }
    return datasets;
};

pandas.get = function(errback, callback) {
    d3.request(errback, function(response) {
        var data = pandas.parse(response.responseText);
        callback(data);
    });
};

function hash(obj) {
    var str = "";
    d3.keys(obj).sort().forEach(function(key) {
        str += key + '=' + obj[key] + '\n';
    });
    return str;
}

d3.pandas = pandas.get;
d3.pandas.parse = pandas.parse;

return pandas;

});
