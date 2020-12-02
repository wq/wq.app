import React from 'react';
import MuiChip from '@material-ui/core/Chip';
import { useIcon } from '@wq/react';
import PropTypes from 'prop-types';

export default function Chip({ icon, ...rest }) {
    const Icon = useIcon(icon);
    return <MuiChip icon={Icon ? <Icon /> : null} {...rest} />;
}

Chip.propTypes = {
    icon: PropTypes.string
};
