import React from 'react';
import MuiButton from '@material-ui/core/Button';
import { useIconComponents } from '@wq/react';
import PropTypes from 'prop-types';

export default function Button({ icon, ...rest }) {
    const { [icon]: Icon } = useIconComponents(),
        startIcon = Icon ? <Icon /> : null;
    return <MuiButton startIcon={startIcon} {...rest} />;
}

Button.propTypes = {
    icon: PropTypes.string
};
