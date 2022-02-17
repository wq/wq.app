import { useEffect } from 'react';
import { usePluginReducer } from '@wq/react';

export default function MapIdentify() {
    const [{ instance: map, overlays }, { setHighlight }] = usePluginReducer(
        'map'
    );

    useEffect(() => {
        if (!map || map._alreadyConfiguredHandlers) {
            return;
        }
        map._alreadyConfiguredHandlers = true;

        overlays.forEach(overlay => {
            getIdentifyLayers(overlay).forEach(layer => {
                map.on('mouseenter', layer, onMouseEnter);
                map.on('mouseleave', layer, onMouseLeave);
                map.on('click', layer, evt => updateHighlight(evt, overlay));
            });
        });

        function onMouseEnter() {
            map.getCanvas().style.cursor = 'pointer';
        }
        function onMouseLeave() {
            map.getCanvas().style.cursor = '';
        }

        function updateHighlight(evt, overlay) {
            const features = evt.features.map(feature => {
                feature.popup = overlay.popup;
                return feature;
            });
            setHighlight({ type: 'FeatureCollection', features });
        }
    }, [map, setHighlight]);

    return null;
}

function getIdentifyLayers(overlay) {
    if (overlay.identifyLayers) {
        return overlay.identifyLayers;
    }
    if (!overlay.popup) {
        return [];
    }
    if (overlay.type === 'geojson') {
        return ['symbol', 'line', 'fill', 'fill-extrusion', 'circle'].map(
            type => `${overlay.name}-${type}`
        );
    } else if (overlay.type === 'vector-tile') {
        return ((overlay.style || {}).layers || []).map(layer => layer.id);
    } else {
        return [];
    }
}
