import React, { useState } from "react";
import { Tabs } from "@mui/material";

export default function TabGroup(props) {
    if (props.value || props.setValue) {
        return <ControlledTabGroup {...props} />;
    } else {
        return <UncontrolledTabGroup {...props} />;
    }
}

function UncontrolledTabGroup({ children, ...rest }) {
    const tabs = React.Children.toArray(children),
        [value, setValue] = useState(tabs[0].props.value);
    return (
        <ControlledTabGroup value={value} setValue={setValue} {...rest}>
            {children}
        </ControlledTabGroup>
    );
}

function ControlledTabGroup({ children, value, setValue, ...rest }) {
    const tabs = React.Children.toArray(children),
        activeTab = tabs.find((tab) => tab.props.value === value),
        handleChange = (evt, tab) => setValue(tab);

    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            <Tabs
                value={value}
                onChange={handleChange}
                variant="fullWidth"
                {...rest}
            >
                {tabs}
            </Tabs>
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                {activeTab && activeTab.props.children}
            </div>
        </div>
    );
}
