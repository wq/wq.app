import React from 'react';
import MuiFab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import { Link } from '@wq/react';
import PropTypes from 'prop-types';

const icons = {
    add: AddIcon,
    edit: EditIcon
};

export default function Fab({ type, to }) {
    const Icon = icons[type];
    return (
        <MuiFab
            component={Link}
            to={to}
            color="primary"
            style={{
                position: 'absolute',
                right: 16,
                bottom: 16
            }}
        >
            <Icon />
        </MuiFab>
    );
}

Fab.propTypes = {
    type: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
};
