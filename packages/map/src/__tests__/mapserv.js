import React from 'react';
import testRender from '@wq/react/test';
import map from '../map';
import mapserv from '../mapserv';

test('ESRI Basemap', () => {
    const { Map } = map.components,
        { EsriBasemap } = mapserv.basemaps;

    const result = testRender(() => (
            <Map>
                <EsriBasemap layer="Imagery" labels />
            </Map>
        )),
        layers = result.root.findByType(EsriBasemap).children[0].children[0]
            .children;

    expect(layers[0].instance.leafletElement._url).toEqual(
        'http://{s}.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    );
    expect(layers[1].instance.leafletElement._url).toEqual(
        'http://{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
    );
});

test('WMS Overlay', () => {
    const { Map } = map.components,
        { Wms } = mapserv.overlays,
        url =
            'http://{s}.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    const result = testRender(() => (
            <Map>
                <Wms url={url} />
            </Map>
        )),
        layer = result.root.findByType(Wms).children[0].instance.leafletElement;
    expect(layer.wmsParams.service).toEqual('WMS');
});
