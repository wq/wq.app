import React from 'react';
import {
    useComponents,
    useReverse,
    useConfig,
    usePluginState
} from '@wq/react';
import PropTypes from 'prop-types';

export default function DefaultPopup({ feature }) {
    const reverse = useReverse(),
        { PropertyTable, View, Fab } = useComponents(),
        config = useConfig(),
        authState = usePluginState('auth'),
        page_config = feature.popup ? config.pages[feature.popup] : null,
        perms =
            page_config &&
            authState &&
            authState.config &&
            authState.config.pages &&
            authState.config.pages[feature.popup];

    let form, editUrl;
    if (page_config) {
        form = page_config.form || [{ name: 'label' }];
        if (perms && perms.can_change) {
            editUrl = reverse(`${feature.popup}_edit`, feature.id);
        }
    } else {
        form = Object.keys(feature.properties).map(name => ({
            name
        }));
    }
    return (
        <View
            style={{
                maxWidth: '70em',
                position: 'relative',
                marginLeft: 'auto',
                marginRight: 'auto'
            }}
        >
            <PropertyTable form={form} values={feature.properties} />
            {editUrl && <Fab icon="edit" to={editUrl} />}
        </View>
    );
}

DefaultPopup.propTypes = {
    feature: PropTypes.object
};
