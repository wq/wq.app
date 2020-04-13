import React from 'react';
import { useIconComponents } from '@wq/react';
import MuiIconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';

export default function IconButton({ icon, ...rest }) {
    const { [icon]: Icon } = useIconComponents();
    return (
        <MuiIconButton {...rest}>
            <Icon />
        </MuiIconButton>
    );
}

IconButton.propTypes = {
    icon: PropTypes.string
};
