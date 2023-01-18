import React from "react";
import { PropertyTable } from "@wq/react";
import PropTypes from "prop-types";

export default function PropertyTableWithoutGeometry({ form, values }) {
    return <PropertyTable form={withoutGeometry(form)} values={values} />;
}

function withoutGeometry(form) {
    const nform = [];
    form.forEach((field) => {
        if (field.type && field.type.startsWith("geo")) {
            return;
        }
        if (field.type === "repeat" || field.type === "group") {
            field = { ...field, children: withoutGeometry(field.children) };
        }
        nform.push(field);
    });
    return nform;
}

PropertyTableWithoutGeometry.propTypes = {
    form: PropTypes.arrayOf(PropTypes.object),
    values: PropTypes.object,
};
