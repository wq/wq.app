import React, { useState } from "react";
import { useComponents } from "../hooks.js";
import PropTypes from "prop-types";

export default function ImagePreview({ value }) {
    const [open, setOpen] = useState(false),
        { View, Popup, Img } = useComponents();
    if (!value) {
        return null;
    }
    const label = value.split("/").reverse()[0];
    return (
        <>
            <Img
                src={value}
                alt={label}
                style={{ maxHeight: 200, maxWidth: "66vw", cursor: "pointer" }}
                onClick={() => setOpen(true)}
            />
            <Popup open={open} onClose={() => setOpen(false)}>
                <View
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 8,
                    }}
                >
                    <Img
                        src={value}
                        alt={label}
                        onClick={() => setOpen(false)}
                        style={{
                            maxWidth: "95vw",
                            maxHeight: "90vh",
                        }}
                    />
                </View>
            </Popup>
        </>
    );
}

ImagePreview.propTypes = {
    value: PropTypes.string,
};
