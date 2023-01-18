import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Source, Layer } from "react-map-gl";

function AutoLayer({ id, active, before, layout, ...rest }) {
    if (active === false) {
        layout = {
            ...(layout || {}),
            visibility: "none",
        };
    }
    return <Layer id={id} beforeId={before} layout={layout} {...rest} />;
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
                <Source key={id} id={id} {...source} />
            ))}
            {layers.map((layer) => (
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
    filter: PropTypes.object,
};

VectorTile.propTypes = {
    name: PropTypes.string,
    active: PropTypes.bool,
    before: PropTypes.string,
    style: PropTypes.object,
    url: PropTypes.string,
};

UrlVectorTile.propTypes = {
    name: PropTypes.string,
    active: PropTypes.bool,
    before: PropTypes.string,
    url: PropTypes.string,
};
