import React from 'react';
import { useComponents } from '@wq/react';
import { useOverlayComponents } from '../hooks';
import { TYPE_MAP, asGeometry, useFeatureCollection } from '../hooks';
import PropTypes from 'prop-types';

export default function EmbeddedGeo({ type, value, setValue }) {
    const { AutoMap } = useComponents(),
        { Draw } = useOverlayComponents(),
        drawType = TYPE_MAP[type] || 'all',
        geojson = useFeatureCollection(value);

    function handleChange(geojson) {
        setValue(asGeometry(geojson));
    }

    return (
        <AutoMap>
            <Draw type={drawType} data={geojson} setData={handleChange} />
        </AutoMap>
    );
}

EmbeddedGeo.makeComponent = props => {
    function Component() {
        return <EmbeddedGeo {...props} />;
    }
    return Component;
};

EmbeddedGeo.propTypes = {
    type: PropTypes.string,
    value: PropTypes.object,
    setValue: PropTypes.func
};
