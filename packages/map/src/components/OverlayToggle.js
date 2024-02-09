import React from "react";
import { useComponents } from "@wq/react";
import PropTypes from "prop-types";

export default function OverlayToggle({ name, legend, active, setActive }) {
    const { ListItem, Switch, Legend } = useComponents();
    return (
        <ListItem
            button
            dense
            disableGutters
            style={{ alignItems: "start" }}
            onClick={() => setActive(!active)}
            icon={() => (
                <Switch
                    color="primary"
                    checked={active}
                    onValueChange={setActive}
                />
            )}
            description={active && legend ? <Legend legend={legend} /> : null}
        >
            {name}
        </ListItem>
    );
}

OverlayToggle.propTypes = {
    name: PropTypes.string,
    legend: PropTypes.object,
    active: PropTypes.bool,
    setActive: PropTypes.func,
};
