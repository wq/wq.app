import React from "react";
import { View } from "react-native";
import { DataTable } from "react-native-paper";
import PropTypes from "prop-types";

export default function TableCell({ interactive, children, ...rest }) {
    const Cell = interactive ? InteractiveCell : DataTable.Cell;
    return <Cell {...rest}>{children}</Cell>;
}

function InteractiveCell(props) {
    return (
        <View
            style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                ...props.style,
            }}
            {...props}
        />
    );
}

TableCell.propTypes = { interactive: PropTypes.bool, children: PropTypes.node };
