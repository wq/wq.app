import React from "react";
import { useComponents } from "../hooks.js";
import PropTypes from "prop-types";

export default function FileLink({ value }) {
    const { Link } = useComponents();
    if (!value) {
        return null;
    }
    const label = value.split("/").reverse()[0];
    return (
        <Link component="a" href={value} target="_blank">
            {label}
        </Link>
    );
}

FileLink.propTypes = {
    value: PropTypes.string,
};
