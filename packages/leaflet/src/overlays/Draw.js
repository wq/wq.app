import React, { useRef } from 'react';
import { useLeaflet, FeatureGroup, MapLayer } from 'react-leaflet';
import { GeoJSON as leaflet } from 'leaflet';
import { EditControl } from 'react-leaflet-draw';
import PropTypes from 'prop-types';

const TYPES = {
    point: ['marker'],
    line_string: ['polyline'],
    polygon: ['polygon', 'rectangle'],
    all: ['marker', 'polyline', 'polygon', 'rectangle']
};

class FeatureImpl extends MapLayer {
    createLeafletElement(props) {
        return leaflet.geometryToLayer(props.data);
    }
}

function Feature(props) {
    const leaflet = useLeaflet();
    return <FeatureImpl leaflet={leaflet} {...props} />;
}

export default function Draw({ type, data, setData }) {
    const ref = useRef(),
        controls = {
            polyline: false,
            polygon: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false
        },
        types = TYPES[type] || TYPES.all;

    types.forEach(type => (controls[type] = {}));

    function save() {
        const { leafletElement } = ref && ref.current;
        if (!leafletElement) {
            return;
        }
        setData(leafletElement.toGeoJSON());
    }

    return (
        <FeatureGroup ref={ref}>
            <EditControl
                draw={controls}
                onCreated={save}
                onEdited={save}
                onDeleted={save}
            />
            {data &&
                data.features.map((feature, i) => (
                    <Feature key={i} data={feature.geometry} />
                ))}
        </FeatureGroup>
    );

    /* FIXME
    var $submit = $geom.parents('form').find('[type=submit]');
    m.on('draw:drawstart draw:editstart draw:deletestart', function() {
        $submit.attr('disabled', true);
    });

    m.on('draw:drawstop draw:editstop draw:deletestop', function() {
        $submit.attr('disabled', false);
    });
    */
}

Draw.propTypes = {
    type: PropTypes.string,
    data: PropTypes.object,
    setData: PropTypes.func
};
