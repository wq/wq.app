import React from "react";

export default function ListSubheader(props) {
    return (
        <li
            style={{
                marginTop: 8,
                borderBottom: "1px solid #999",
                color: "#999",
                listStyleType: "none",
            }}
            {...props}
        />
    );
}
