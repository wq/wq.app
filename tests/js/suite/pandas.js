define(['wq/pandas'], function(pandas) {

QUnit.module('wq/pandas');

QUnit.test("pandas.parse()", function(assert) {
    assert.deepEqual([{
        'site': 'SITE1',
        'parameter': 'PARAM1',
        'data': [
            {'date': '2014-01-01', 'val1': 0.6, 'val2': 0.3}
        ]
    }], pandas.parse(
        ",val1,val2\n" +
        "site,SITE1,SITE1\n" +
        "parameter,PARAM1,PARAM1\n" +
        "date,,\n" +
        "2014-01-01,0.6,0.3\n"
    ), 'parsed csv string');
});


QUnit.test("pandas.get()", function(assert) {
    var done = assert.async();
    pandas.get('data.csv', function(data) {
        assert.deepEqual([
            {
                'site': 'SITE1',
                'parameter': 'PARAM1',
                'data': [
                    {'date': '2014-01-01', 'value': 0.5},
                    {'date': '2014-01-02', 'value': 0.1}
                ]
            },
            {
                'site': 'SITE2',
                'parameter': 'PARAM1',
                'data': [
                    {'date': '2014-01-01', 'value': 0.5},
                    {'date': '2014-01-02', 'value': 0.5}
                ]
            },
            {
                'site': 'SITE3',
                'parameter': 'PARAM2',
                'data': [
                    {'date': '2014-01-01', 'value': 0.2},
                    {'date': '2014-01-02', 'value': 0.2}
                ]
            }
        ], data, 'parsed csv file');
        done();
    });
});

});
