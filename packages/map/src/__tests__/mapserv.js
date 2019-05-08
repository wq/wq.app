import map from '../mapserv';

test('ESRI Basemap', () => {
    var layer = map.createBasemap({
        type: 'esri-basemap',
        layer: 'Imagery',
        labels: true
    });
    expect(layer._layers['1']._url).toEqual(
        'http://{s}.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    );
    expect(layer._layers['2']._url).toEqual(
        'http://{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
    );
});

test('WMS Overlay', () => {
    var layer = map.createOverlay({
        type: 'wms',
        url:
            'http://services.nationalmap.gov/arcgis/services/GlobalMap/GlobalMapWMS/MapServer/WMSServer'
    });
    expect(layer.wmsParams.service).toEqual('WMS');
});
