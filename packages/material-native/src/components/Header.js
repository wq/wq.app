import React from 'react';
import { Appbar } from 'react-native-paper';
import { useBreadcrumbs, useNav } from '@wq/react';
import PropTypes from 'prop-types';

export default function Header({ scene }) {
    const breadcrumbs = useBreadcrumbs() || [],
        previous = breadcrumbs[breadcrumbs.length - 2],
        nav = useNav(previous?.url);
    return (
        <Appbar.Header>
            {previous && <Appbar.BackAction onPress={nav} />}
            <Appbar.Content title={scene?.descriptor.options.title} />
        </Appbar.Header>
    );
}

Header.propTypes = {
    navigation: PropTypes.object,
    scene: PropTypes.object,
    previous: PropTypes.object
};
