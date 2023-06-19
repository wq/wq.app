import React from "react";

export default function TabItem({ label, children }) {
    return (
        <>
            <h3>{label}</h3>
            <div>{children}</div>
        </>
    );
}
