import React from "react";
import PropTypes from "prop-types";

const variants = {
    default: "p",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    subtitle1: "h6",
    subtitle2: "h6",
    body1: "p",
    body2: "p",
    caption: "small",
};

export default function Typography({ variant, ...rest }) {
    const Component = variants[variant] || variants.default;
    return <Component {...rest} />;
}

Typography.propTypes = {
    variant: PropTypes.string,
};
