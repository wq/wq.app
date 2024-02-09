import React, { useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useStyleProp } from "@wq/map";
import { Source, Layer } from "react-map-gl";

function AutoLayer({ id, active, before, layout = {}, paint = {}, ...rest }) {
    const layer = useMemo(() => {
        return {
            id,
            layout:
                active === false ? { ...layout, visibility: "none" } : layout,
            paint,
        };
    }, [id, active, layout, paint]);

    return <Layer beforeId={before} {...layer} {...rest} />;
}

export default function VectorTile(props) {
    if (props.url) {
        return <UrlVectorTile {...props} />;
    } else {
        return <StyleVectorTile {...props} />;
    }
}

function StyleVectorTile(props) {
    const { sources, layers } = useStyleProp(props);

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
                    active={props.active}
                    before={props.before}
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
            <StyleVectorTile
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
