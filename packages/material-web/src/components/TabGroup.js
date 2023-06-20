import React, { useState } from "react";
import { Tabs } from "@mui/material";

export default function TabGroup({ children, ...rest }) {
    const tabs = React.Children.toArray(children),
        [value, setValue] = useState(tabs[0].props.value),
        activeTab = tabs.find((tab) => tab.props.value === value),
        handleChange = (evt, tab) => setValue(tab);

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Tabs
                value={value}
                onChange={handleChange}
                variant="fullWidth"
                {...rest}
            >
                {tabs}
            </Tabs>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {activeTab && activeTab.props.children}
            </div>
        </div>
    );
}
