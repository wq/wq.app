/*
FIXME

// Internal function for creating markers (used with layerconf.icon)
function _makeMarker(icon) {
    return function pointToLayer(geojson, latlng) {
        // Define icon as a function to customize per-feature
        var key;
        if (typeof icon == 'function') {
            key = icon(geojson.properties);
        } else if (icon.indexOf('{{') > -1) {
            key = tmpl.render(icon, geojson.properties);
        } else {
            key = icon;
        }
        return L.marker(latlng, { icon: map.icons[key] });
    };
}
*/
