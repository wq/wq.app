import React from 'react';
import { useComponents } from '@wq/react';
import { useMapState, useOverlayComponents } from '../hooks';
import PropTypes from 'prop-types';

export default function AutoMap({
    name,
    containerStyle,
    context,
    state,
    children
}) {
    const mapState = useMapState(),
        {
            Map,
            MapInteraction,
            MapAutoZoom,
            AutoBasemap,
            AutoOverlay,
            Legend,
            BasemapToggle,
            OverlayToggle
        } = useComponents(),
        { Highlight } = useOverlayComponents();

    if (!state) {
        state = mapState;
    }

    if (!state) {
        return null;
    }

    const {
        basemaps,
        overlays,
        initBounds,
        mapProps,
        autoZoom,
        highlight
    } = state;

    return (
        <Map
            name={name}
            initBounds={initBounds}
            mapProps={mapProps}
            containerStyle={containerStyle}
        >
            <MapInteraction name={name} />
            {!!autoZoom && (
                <MapAutoZoom name={name} context={context} {...autoZoom} />
            )}
            <Legend>
                {basemaps.map((conf, i) => (
                    <BasemapToggle
                        key={i}
                        name={conf.name}
                        active={conf.active}
                    >
                        <AutoBasemap {...conf} />
                    </BasemapToggle>
                ))}
                {overlays.map((conf, i) => (
                    <OverlayToggle
                        key={i}
                        name={conf.name}
                        active={conf.active}
                    >
                        <AutoOverlay {...conf} context={context} />
                    </OverlayToggle>
                ))}
            </Legend>
            {highlight && <Highlight data={highlight} />}
            {children}
        </Map>
    );
}

AutoMap.propTypes = {
    name: PropTypes.string,
    containerStyle: PropTypes.object,
    context: PropTypes.object,
    state: PropTypes.object,
    children: PropTypes.node
};

/*
        if (defaults.autoZoom.sticky) {
            m.fitBounds(defaults.lastBounds || defaults.bounds);
        }

    Promise.all(results).then(autoZoom);

    function autoZoom() {
        if (mapconf.autoZoom !== undefined && !mapconf.autoZoom) {
            return;
        }
        if (!map.config.defaults.autoZoom) {
            return;
        }
        var lnames = Object.keys(layers);
        if (!lnames.length) {
            return;
        }
        var bounds;
        lnames.forEach(function(lname) {
            if (!layers[lname].getBounds) {
                return;
            }
            if (!m.hasLayer(layers[lname])) {
                return;
            }
            var layerBounds = layers[lname].getBounds();
            if (bounds) {
                bounds.extend(layerBounds);
            } else if (layerBounds.isValid()) {
                bounds = layerBounds;
            }
        });
        if (mapconf.minBounds) {
            if (bounds) {
                bounds.extend(mapconf.minBounds);
            } else {
                bounds = mapconf.minBounds;
            }
        } else if (!bounds) {
            bounds = map.config.defaults.bounds;
        }
        setTimeout(function() {
            m.fitBounds(bounds, map.config.defaults.autoZoom);
        }, map.config.defaults.autoZoom.wait * 1000);
    }

    if (map.config.defaults.autoZoom.sticky) {
        m.on('moveend', function() {
            const bounds = m.getBounds();
            if (!bounds.isValid()) {
                return;
            }
            if (bounds.getSouthWest().equals(bounds.getNorthEast())) {
                return;
            }
            map.config.defaults.lastBounds = bounds;
        });
    }
*/
