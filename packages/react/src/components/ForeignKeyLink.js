import React from "react";
import { useComponents, useModel, useReverse } from "../hooks.js";
import PropTypes from "prop-types";

export default function ForeignKeyLink({ id, label, model }) {
    const { Link } = useComponents(),
        reverse = useReverse(),
        obj = useModel(model, id || -1) || { label: id };
    if (!id) {
        return null;
    }
    return (
        <Link to={reverse(`${model}_detail`, id)}>{label || obj.label}</Link>
    );
}

ForeignKeyLink.propTypes = {
    id: PropTypes.string,
    label: PropTypes.string,
    model: PropTypes.string,
};
