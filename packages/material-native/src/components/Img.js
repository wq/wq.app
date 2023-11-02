import React, { useState, useEffect } from "react";
import { Image, TouchableOpacity, Dimensions } from "react-native";
import PropTypes from "prop-types";

export default function Img({ src, onPress, onClick, style, ...props }) {
    const [source, setSource] = useState(src ? { uri: src } : null);
    useEffect(() => {
        if (!src) {
            return;
        }
        if (typeof src !== "string") {
            setSource(src);
            return;
        }
        Image.getSize(src, (width, height) => {
            setSource({ uri: src, width, height });
        });
    }, [src]);

    let resizeMode;
    if (
        style &&
        typeof style.maxHeight === "number" &&
        typeof style.maxWidth === "string" &&
        style.maxWidth.endsWith("vw")
    ) {
        resizeMode = "contain";
        const ratio =
                source && source.width && source.height
                    ? source.width / source.height
                    : 1,
            maxWidth =
                (+style.maxWidth.replace(/vw/g, "") / 100) *
                Dimensions.get("window").width;
        style = {
            ...style,
            maxHeight: undefined,
            maxWidth: undefined,
            height: style.maxHeight,
            width: Math.min(ratio * style.maxHeight, maxWidth),
        };
    } else if (
        style &&
        typeof style.maxHeight === "string" &&
        typeof style.maxWidth === "string"
    ) {
        resizeMode = "contain";
        style = {
            ...style,
            maxHeight: undefined,
            maxWidth: undefined,
            height: style.maxHeight.replace("vh", "%"),
            width: style.maxWidth.replace("vw", "%"),
        };
    }

    const hasSize =
        (source && (source === src || (source.width && source.height))) ||
        props.width ||
        props.height ||
        (style && style.width) ||
        (style && style.height);
    if (src && !hasSize) {
        return null;
    } else if (onPress || onClick) {
        return (
            <TouchableOpacity
                onPress={onPress || onClick}
                style={{
                    ...style,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Image
                    resizeMode={resizeMode}
                    style={style}
                    source={source}
                    {...props}
                />
            </TouchableOpacity>
        );
    } else {
        return (
            <Image
                resizeMode={resizeMode}
                style={style}
                source={source}
                {...props}
            />
        );
    }
}

Img.propTypes = {
    src: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    width: PropTypes.number,
    height: PropTypes.number,
    onPress: PropTypes.func,
    onClick: PropTypes.func,
    style: PropTypes.object,
};
