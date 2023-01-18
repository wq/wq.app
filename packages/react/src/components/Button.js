import React from "react";
import PropTypes from "prop-types";

export default function Button({ type = "button", ...rest }) {
    return <button type={type} {...rest} />;
}

Button.propTypes = {
    type: PropTypes.string,
};
