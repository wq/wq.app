import React from 'react';
import MuiFab from '@material-ui/core/Fab';
import { Link } from '@wq/react';
import PropTypes from 'prop-types';
import { useIconComponents } from '@wq/react';

export default function Fab({ icon, to }) {
    const { [icon]: Icon } = useIconComponents();
    return (
        <MuiFab
            component={Link}
            to={to}
            color="primary"
            style={{
                position: 'absolute',
                right: 16,
                bottom: 16,
                zIndex: 1
            }}
        >
            <Icon />
        </MuiFab>
    );
}

Fab.propTypes = {
    icon: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
};
