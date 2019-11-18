/*
FIXME

map.addDrawControl = function(m, layer, layerconf, $geom) {
    var control = new L.Control.Draw({
        draw: layerconf.draw,
        edit: { featureGroup: layer }
    }).addTo(m);

    m.on('draw:created', function(e) {
        layer.addLayer(e.layer);
        save();
    });

    m.on('draw:edited', save);
    m.on('draw:deleted', save);

    var $submit = $geom.parents('form').find('[type=submit]');
    m.on('draw:drawstart draw:editstart draw:deletestart', function() {
        $submit.attr('disabled', true);
    });

    m.on('draw:drawstop draw:editstop draw:deletestop', function() {
        $submit.attr('disabled', false);
    });

    save();

    return control;

    function flatten(geojson) {
        var geoms = [];
        if (geojson.type == 'FeatureCollection') {
            geojson.features.forEach(function(feature) {
                addGeometry(feature.geometry);
            });
        }
        if (geoms.length == 1) {
            return geoms[0];
        } else {
            return {
                type: 'GeometryCollection',
                geometries: geoms
            };
        }
        function addGeometry(geometry) {
            if (geometry.type == 'GeometryCollection') {
                geometry.geometries.forEach(addGeometry);
            } else {
                geoms.push(geometry);
            }
        }
    }

    function save() {
        var geojson = layer.toGeoJSON();
        if (layerconf.flatten) {
            // Flatten FeatureCollection into single Geometry (or
            // GeometryCollection).
            geojson = flatten(geojson);
        }
        $geom.val(JSON.stringify(geojson));
        map.cache = {};
    }
};

*/
