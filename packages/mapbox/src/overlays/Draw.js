import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import DrawControl from 'react-mapbox-gl-draw';

export default function Draw({ type, required, data, setData }) {
    const types = type === 'all' ? ['point', 'line_string', 'polygon'] : [type],
        controls = {},
        ref = useRef();

    types.forEach(type => (controls[type] = true));

    if (!required) {
        controls.trash = true;
    }

    useEffect(() => {
        if (data && ref.current) {
            const { draw } = ref.current;
            draw.set(data);
        }
    }, [ref, data]);

    function handleChange() {
        const { draw } = ref.current;
        setData(draw.getAll());
    }

    return (
        <DrawControl
            ref={ref}
            position="top-right"
            displayControlsDefault={false}
            controls={controls}
            onDrawCreate={handleChange}
            onDrawDelete={handleChange}
            onDrawUpdate={handleChange}
            onDrawCombine={handleChange}
            onDrawUncombine={handleChange}
        />
    );
}

Draw.propTypes = {
    type: PropTypes.string,
    required: PropTypes.boolean,
    data: PropTypes.object,
    setData: PropTypes.func
};
