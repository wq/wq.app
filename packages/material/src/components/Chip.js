import React from 'react';
import MuiChip from '@material-ui/core/Chip';
import { useIconComponents } from '@wq/react';
import PropTypes from 'prop-types';

export default function Chip({ icon, ...rest }) {
    const icons = useIconComponents(),
        Icon = icon ? icons[icon] : null;
    return <MuiChip icon={Icon ? <Icon /> : null} {...rest} />;
}

Chip.propTypes = {
    icon: PropTypes.string
};
