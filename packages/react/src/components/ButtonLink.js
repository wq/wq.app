import React from "react";
import Link from "./Link.js";

export default function ButtonLink(props) {
    return (
        <Link
            style={{
                textDecoration: "none",
                border: "1px solid #eee",
                borderRadius: "0.2em",
                padding: "0.2em",
            }}
            {...props}
        />
    );
}
