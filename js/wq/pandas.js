/*
 * wq.app 0.5.1-dev - pandas.js
 * Load and parse CSV with complex headers (e.g. from pandas DataFrames)
 * (c) 2014, S. Andrew Sheppard
 * http://wq.io/license
 */

define(['d3'], function(d3) {

var pandas = {};

pandas.parse = function(str) {
    /* Parses a string with the following structure:
       
    ,value,value,value
    site,SITE1,SITE2,SITE3
    parameter,PARAM1,PARAM1,PARAM2
    date,,,
    2014-01-01,0.5,0.5,0.2
    2014-01-02,0.1,0.5,0.2

    ...

    */
    var idColumns, datasets = [], data, valuesHeader,
        rows = d3.csv.parseRows(str);

    // Parse CSV headers and data
    rows.forEach(function(row, i) {
        if (data) {
            parseData(row);
        } else if (i === 0 && row[0] === "") {
            parseValuesHeader(row);
        } else if (valuesHeader && row[row.length - 1] !== "") {
            parseMetaHeader(row);
        } else if (valuesHeader) {
            parseIdHeader(row);
            data = true;
        } else {
            parseSimpleHeader(row);
            data = true;
        }
    });

    function parseValuesHeader(row) {
        // Blank first column => this row has value column labels
        // FIXME: currently assuming ,value,value,value,...
        // should support more than one 'value' field per record
        valuesHeader = row;
    }

    function parseMetaHeader(row) {
        // First & last column aren't blank => this row contains metadata
        var metaname = row[0];
        var metaStart = valuesHeader.lastIndexOf("") + 1;
        row.slice(metaStart).forEach(function(d, i) {
            if (!datasets[i])
                datasets[i] = {'list':[]};
            datasets[i][metaname] = d;
        });
    }

    function parseIdHeader(row) {
        // Blank last column => this row has index column labels
        if (row.indexOf("") != valuesHeader.lastIndexOf("") + 1)
            throw "Header mismatch!";
        idColumns = row.slice(0, row.indexOf(""));
    }

    function parseSimpleHeader(row) {
        // No values header found, assume:
        // - single-row header
        // - first column is row id (i.e. date)
        // - all other columns represent individual timeseries
        idColumns = [row[0]];
        row.slice(1).forEach(function(s, i) {
            datasets[i] = {'name': s, 'list': []};
        });
    }

    function parseData(row) {
        // Parse a row of data, using header information as appropriate
        var id = {};
        idColumns.forEach(function(c, i) {
            id[c] = row[i];
        });
        row.slice(idColumns.length).forEach(function(d, i) {
            var c, item = {};
            if (d === "")
                return;
            for (c in id)
                item[c] = id[c];
            // FIXME: should use valuesHeader
            item.value = d;
            datasets[i].list.push(item);
        });
    }
    return datasets;
};

pandas.get = function(errback, callback) {
    d3.xhr(errback, function(response) {
        var data = pandas.parse(response.responseText);
        callback(data);
    });
};

d3.pandas = pandas.get;
d3.parsePandas = pandas.parse;

return pandas;

});
