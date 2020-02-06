import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';

function AutoSource({ id, type, ...rest }) {
    let geoJsonSource, tileJsonSource;
    if (type === 'geojson') {
        geoJsonSource = { type, ...rest };
    } else {
        tileJsonSource = { type, ...rest };
    }
    return (
        <Source
            id={id}
            tileJsonSource={tileJsonSource}
            geoJsonSource={geoJsonSource}
        />
    );
}

function AutoLayer({
    active,
    before,
    id,
    type,
    layout,
    paint,
    metadata,
    source: sourceId,
    ['source-layer']: sourceLayer,
    minzoom: minZoom,
    maxzoom: maxZoom,
    filter
}) {
    if (active === false) {
        layout = {
            ...(layout || {}),
            visibility: 'none'
        };
    }
    return (
        <Layer
            before={before}
            id={id}
            type={type}
            layout={layout}
            paint={paint}
            metadata={metadata}
            sourceId={sourceId}
            sourceLayer={sourceLayer}
            minZoom={minZoom}
            maxZoom={maxZoom}
            filter={filter}
        />
    );
}

export default function VectorTile({ name, active, before, url, style }) {
    if (url) {
        return (
            <UrlVectorTile
                name={name}
                active={active}
                url={url}
                before={before}
            />
        );
    }

    const { sources, layers } = style;
    if (!sources || !layers) {
        return null;
    }

    return (
        <>
            {Object.entries(sources).map(([id, source]) => (
                <AutoSource key={id} id={id} {...source} />
            ))}
            {layers.map(layer => (
                <AutoLayer
                    key={layer.id}
                    active={active}
                    before={before}
                    {...layer}
                />
            ))}
        </>
    );
}

function UrlVectorTile({ name, active, before, url }) {
    const [style, setStyle] = useState();
    useEffect(() => {
        async function loadStyle() {
            const response = await fetch(url),
                data = await response.json();
            setStyle(data);
        }
        loadStyle();
    }, [url]);

    if (style) {
        return (
            <VectorTile
                name={name}
                active={active}
                before={before}
                style={style}
            />
        );
    } else {
        return null;
    }
}

AutoSource.propTypes = {
    id: PropTypes.string,
    type: PropTypes.string
};

AutoLayer.propTypes = {
    active: PropTypes.bool,
    before: PropTypes.string,
    id: PropTypes.string,
    type: PropTypes.string,
    layout: PropTypes.object,
    paint: PropTypes.object,
    metadata: PropTypes.object,
    source: PropTypes.string,
    minzoom: PropTypes.number,
    maxzoom: PropTypes.number,
    filter: PropTypes.object
};

VectorTile.propTypes = {
    name: PropTypes.string,
    active: PropTypes.bool,
    before: PropTypes.string,
    style: PropTypes.object,
    url: PropTypes.string
};

UrlVectorTile.propTypes = {
    name: PropTypes.string,
    active: PropTypes.bool,
    before: PropTypes.string,
    url: PropTypes.string
};
