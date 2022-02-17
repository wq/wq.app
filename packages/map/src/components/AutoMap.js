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
            MapIdentify,
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

    const identify = overlays.some(overlay => !!overlay.popup);

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
            {identify && <MapIdentify name={name} context={context} />}
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

AutoMap.makeComponent = props => {
    function Component() {
        return <AutoMap {...props} />;
    }

    return Component;
};

AutoMap.propTypes = {
    name: PropTypes.string,
    containerStyle: PropTypes.object,
    context: PropTypes.object,
    state: PropTypes.object,
    children: PropTypes.node
};
