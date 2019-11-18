import React from 'react';
import PropTypes from 'prop-types';

export default function Legend({ children }) {
    return (
        <table>
            <thead>
                <tr>
                    <th>Group</th>
                    <th>Name</th>
                    <th>Active</th>
                    <th>Detail</th>
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    );
}
Legend.propTypes = {
    children: PropTypes.node
};

export function BasemapToggle({ name, active, children }) {
    return (
        <tr>
            <td>Basemap</td>
            <td>{name}</td>
            <td>{active ? 'Y' : 'N'}</td>
            <td>{children}</td>
        </tr>
    );
}
BasemapToggle.propTypes = {
    name: PropTypes.string,
    active: PropTypes.bool,
    children: PropTypes.node
};

export function OverlayToggle({ name, active, children }) {
    return (
        <tr>
            <td>Overlay</td>
            <td>{name}</td>
            <td>{active ? 'Y' : 'N'}</td>
            <td>{children}</td>
        </tr>
    );
}

OverlayToggle.propTypes = {
    name: PropTypes.string,
    active: PropTypes.bool,
    children: PropTypes.node
};
