import { useEffect } from 'react';
import { useMapInstance } from '@wq/map';

export default function MapAutoZoom({ name, context, wait, maxZoom, animate }) {
    const map = useMapInstance(name);

    useEffect(() => {
        if (!map || !context) {
            return;
        }
        const startTime = new Date();

        setTimeout(autoZoom, 300);

        function autoZoom() {
            let bounds;
            map.eachLayer(function (layer) {
                if (!layer.getBounds) {
                    return;
                }
                let layerBounds = layer.getBounds();
                if (bounds) {
                    bounds.extend(layerBounds);
                } else if (layerBounds.isValid()) {
                    bounds = layerBounds;
                }
            });

            if (bounds) {
                const elapsed = new Date() - startTime,
                    timeout = Math.max(wait * 1000 - elapsed, 0);
                setTimeout(() => {
                    map.invalidateSize();
                    map.fitBounds(bounds, { maxZoom, animate });
                }, timeout);
            }
        }
    }, [map, context]);

    return null;
}
