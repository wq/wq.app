import React from "react";
import PropTypes from "prop-types";

export default function MapLayers({ children }) {
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
            <tbody>
                {React.Children.map(children, (element) => (
                    <MapLayer element={element} />
                ))}
            </tbody>
        </table>
    );
}
MapLayers.propTypes = {
    children: PropTypes.node,
};

export function MapLayer({ element }) {
    if (!element || !element.type) {
        return null;
    }
    const type = element.type.isAutoBasemap ? "Basemap" : "Overlay",
        { name, active } = element.props;
    return (
        <tr>
            <td>{type}</td>
            <td>{name}</td>
            <td>{active ? "Y" : "N"}</td>
            <td>{element}</td>
        </tr>
    );
}

MapLayer.propTypes = {
    element: PropTypes.node,
};
