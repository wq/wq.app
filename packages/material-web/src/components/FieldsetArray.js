import React from "react";
import { useComponents } from "@wq/react";
import PropTypes from "prop-types";

export default function FieldsetArray({ label, children, addRow }) {
    const { View, Button } = useComponents();
    return (
        <View>
            {children}
            {addRow && (
                <Button onClick={() => addRow()}>{`Add ${label}`}</Button>
            )}
        </View>
    );
}

FieldsetArray.propTypes = {
    label: PropTypes.string,
    children: PropTypes.node,
    addRow: PropTypes.func,
};
