/*!
 * wq.app 2.0.0-dev - wq/chart.js
 * d3-powered CSV charts for @wq/app pages
 * (c) 2013-2019, S. Andrew Sheppard
 * https://wq.io/license
 */

var chart = require('./src/chart.js');
var chartapp = require('./src/chartapp.js');
var pandas = require('./src/pandas.js');
chartapp.chart = chart;
chartapp.pandas = pandas;
module.exports = chartapp;
