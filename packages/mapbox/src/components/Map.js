import React, { useMemo } from 'react';
import { usePlugin } from '@wq/react';
import PropTypes from 'prop-types';
import ReactMapboxGl from 'react-mapbox-gl';
import { useMapState } from '@wq/map';

export default function Map({ bounds, children, mapProps, containerStyle }) {
    const { ready } = usePlugin('map'),
        Root = useMemo(() => ReactMapboxGl(mapProps || {}), [mapProps]),
        fitBounds = useMemo(() => {
            const [[ymin, xmin], [ymax, xmax]] = bounds;
            return [
                [xmin, ymin],
                [xmax, ymax]
            ];
        }, [bounds]),
        state = useMapState(),
        basemap = state && state.basemaps.filter(basemap => basemap.active)[0];

    let style;
    if (basemap) {
        if (basemap.type === 'vector-tile') {
            style = basemap.url;
        } else if (basemap.type === 'tile') {
            const urls = [];
            if (basemap.url.match('{s}')) {
                (basemap.subdomains || ['a', 'b', 'c']).forEach(s =>
                    urls.push(basemap.url.replace('{s}', s))
                );
            } else {
                urls.push(basemap.url);
            }
            style = {
                version: 8,
                sources: {
                    [basemap.name]: {
                        type: 'raster',
                        tiles: urls,
                        tileSize: basemap.tileSize || 256
                    }
                },
                layers: [
                    {
                        id: basemap.name,
                        type: 'raster',
                        source: basemap.name
                    }
                ]
            };
        }
    } else {
        style = null;
    }

    containerStyle = {
        flex: '1',
        minHeight: 200,
        ...containerStyle
    };

    return (
        <Root
            style={style}
            fitBounds={fitBounds}
            onStyleLoad={ready}
            containerStyle={containerStyle}
        >
            {children}
        </Root>
    );
}

Map.propTypes = {
    bounds: PropTypes.array,
    children: PropTypes.node,
    mapProps: PropTypes.object,
    containerStyle: PropTypes.object
};
