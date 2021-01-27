import React from 'react';
import PropTypes from 'prop-types';
import Mustache from 'mustache';
import { useGeoJSON } from '@wq/map';
import { usePlugin } from '@wq/react';
import { GeoJSON as LGeoJSON } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';

export default function Geojson({
    url,
    data,
    style,
    icon,
    popup,
    oneach,
    cluster,
    clusterIcon
}) {
    const { config } = usePlugin('leaflet'),
        { config: jqmConfig } = usePlugin('jqmrenderer') || {},
        geojson = useGeoJSON(url, data),
        options = {};

    if (!geojson || !geojson.type) {
        return null;
    }

    if (popup) {
        const template =
            config.popups[popup] ||
            (jqmConfig && jqmConfig.templates[`${popup}_popup`]) ||
            popup;
        popup = ({ id, properties }, layer) => {
            layer.bindPopup(Mustache.render(template, { id, ...properties }));
        };
    }

    if (oneach && popup) {
        options.onEachFeature = function (feat, layer) {
            popup(feat, layer);
            oneach(feat, layer);
        };
    } else if (oneach) {
        options.onEachFeature = oneach;
    } else if (popup) {
        options.onEachFeature = popup;
    }

    if (icon) {
        options.pointToLayer = function pointToLayer(geojson, latlng) {
            // Define icon as a function to customize per-feature
            var key;
            if (typeof icon == 'function') {
                key = icon(geojson.properties);
            } else if (icon.indexOf('{{') > -1) {
                key = Mustache.render(icon, geojson.properties);
            } else {
                key = icon;
            }
            return L.marker(latlng, { icon: config.icons[key] });
        };
    }

    let Component;
    if (cluster) {
        Component = MarkerCluster;
        options.clusterIcon = clusterIcon;
    } else {
        Component = LGeoJSON;
    }

    return <Component data={geojson} style={style} {...options} />;
}

Geojson.propTypes = {
    url: PropTypes.string,
    data: PropTypes.object,
    style: PropTypes.func,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    popup: PropTypes.string,
    oneach: PropTypes.func,
    cluster: PropTypes.bool,
    clusterIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
};

function MarkerCluster({ clusterIcon, ...rest }) {
    const options = {};
    if (clusterIcon) {
        options.iconCreateFunction = function clusterDiv(cluster) {
            var cls;
            var context = {
                count: cluster.getChildCount()
            };
            if (context.count >= 100) {
                context.large = true;
            } else if (context.count >= 10) {
                context.medium = true;
            } else {
                context.small = true;
            }
            if (typeof clusterIcon == 'function') {
                cls = clusterIcon(context);
            } else if (clusterIcon.indexOf('{{') > -1) {
                cls = Mustache.render(clusterIcon, context);
            } else {
                cls = clusterIcon;
            }
            var html = Mustache.render(
                '<div><span>{{count}}</span></div>',
                context
            );
            return new L.DivIcon({
                html: html,
                className: 'marker-cluster ' + cls,
                iconSize: new L.Point(40, 40)
            });
        };
    }
    return (
        <MarkerClusterGroup {...options}>
            <LGeoJSON {...rest} />
        </MarkerClusterGroup>
    );
}
MarkerCluster.propTypes = {
    clusterIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
};
