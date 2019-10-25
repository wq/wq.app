import React from 'react';
import PropTypes from 'prop-types';
import { useGeoJSON } from '../hooks';
import { GeoJSON as LGeoJSON } from 'react-leaflet';

export default function Geojson(props) {
    const { url, data, draw } = props;
    /* FIXME
    const { style } = props;
    var overlay;
    if (layerconf.cluster && L.MarkerClusterGroup) {
        var options = {};
        if (layerconf.clusterIcon) {
            options.iconCreateFunction = _makeCluster(layerconf.clusterIcon);
        }
        overlay = new L.MarkerClusterGroup(options);
    } else {
        overlay = L.featureGroup();
    }
    */

    // Load layer content as JSON
    const geojson = useGeoJSON(url, data, !!draw);

    /*var options = {},
            popup,
            oneach;*/
    /*
        if (!geojson || !geojson.type) {
            console.warn('Ignoring empty or malformed GeoJSON result.');
            return null;
        }
        */
    /*
        if (layerconf.popup) {
            popup = map.renderPopup(layerconf.popup);
        }
        if (layerconf.oneach) {
            if (typeof layerconf.oneach == 'function') {
                oneach = layerconf.oneach;
            } else {
                oneach = map.onEachFeature[layerconf.oneach];
            }
        }
        if (oneach && popup) {
            options.onEachFeature = function(feat, layer) {
                popup(feat, layer);
                oneach(feat, layer);
            };
        } else if (oneach) {
            options.onEachFeature = oneach;
        } else if (popup) {
            options.onEachFeature = popup;
        }
        if (layerconf.icon) {
            options.pointToLayer = _makeMarker(layerconf.icon);
        }
        */
    /*
        if (layerconf.cluster && L.MarkerClusterGroup) {
            gjLayer.getLayers().forEach(function(layer) {
                layer.addTo(overlay);
            });
        } else {
            gjLayer.addTo(overlay);
        }
        return gjLayer;
        */

    return geojson ? <LGeoJSON data={geojson} /> : null;
}

Geojson.propTypes = {
    url: PropTypes.string,
    data: PropTypes.object,
    draw: PropTypes.object
};
