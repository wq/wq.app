import React from 'react';
import { useComponents } from '@wq/react';
import PropTypes from 'prop-types';

export default function Legend({ legend }) {
    const { Typography, LegendIcon } = useComponents();
    return (
        <div>
            {Object.entries(legend).map(([label, icon]) => (
                <div
                    style={{ display: 'flex', alignItems: 'center' }}
                    key={label}
                >
                    <Typography variant="caption" style={{ flex: 1 }}>
                        {label}
                    </Typography>
                    <div style={{ width: 48 }}>
                        <LegendIcon name={icon} label={label} />
                    </div>
                </div>
            ))}
        </div>
    );
}

Legend.propTypes = {
    legend: PropTypes.object
};
