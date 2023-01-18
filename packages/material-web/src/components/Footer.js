import React from "react";
import { useComponents } from "@wq/react";

export default function Footer() {
    const { Typography, FooterContent } = useComponents();

    return (
        <div
            style={{
                height: "3em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "white",
                borderTop: "1px solid rgba(0, 0, 0, 0.12)",
            }}
        >
            <Typography variant="caption" color="textSecondary">
                <FooterContent />
            </Typography>
        </div>
    );
}
