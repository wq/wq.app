import React from "react";
import { useComponents } from "../hooks.js";
import PropTypes from "prop-types";

const Value = ({ values, field }) => {
    const { FormatJson, ImagePreview, FileLink } = useComponents(),
        value = values[field.name];

    if (field.children && values[field.name]) {
        if (field.type === "repeat") {
            return (
                <PropertyTableList
                    form={field.children}
                    values={values[field.name]}
                />
            );
        } else {
            return (
                <PropertyTable
                    form={field.children}
                    values={values[field.name]}
                />
            );
        }
    } else if (field["wq:ForeignKey"]) {
        if (value && typeof value === "object" && value.label) {
            return value.label;
        } else {
            return (
                values[field.name + "_label"] ||
                values[field.name + "_id"] ||
                value + ""
            );
        }
    } else if (field.choices) {
        const choice = field.choices.find((c) => c.name === value);
        if (choice && choice.label) {
            return choice.label;
        } else {
            return values[field.name + "_label"] || value + "";
        }
    } else if (field.type === "image") {
        return <ImagePreview value={value} field={field} />;
    } else if (field.type === "file") {
        return <FileLink value={value} field={field} />;
    } else if (typeof value === "object") {
        return <FormatJson json={value} field={field} />;
    } else {
        return value + "";
    }
};

const isInteractive = (values, field) => {
    const result = Value({ values, field });
    if (result && typeof result !== "string") {
        return true;
    } else {
        return false;
    }
};

export default function PropertyTable({ form, values }) {
    const { Table, TableBody, TableRow, TableCell } = useComponents(),
        rootFieldset = form.find(
            (field) => field.name === "" && field.type === "group"
        ),
        fields = rootFieldset
            ? rootFieldset.children.concat(
                  form.filter((field) => field !== rootFieldset)
              )
            : form;
    return (
        <Table>
            <TableBody>
                {fields.map((field) => (
                    <TableRow key={field.name}>
                        <TableCell>{field.label || field.name}</TableCell>
                        <TableCell interactive={isInteractive(values, field)}>
                            <Value values={values} field={field} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

PropertyTable.propTypes = {
    form: PropTypes.arrayOf(PropTypes.object),
    values: PropTypes.object,
};

function PropertyTableList({ form, values }) {
    const { Divider } = useComponents();
    if (!Array.isArray(values)) {
        return null;
    }
    return (
        <>
            {values.map((vals, i) => (
                <React.Fragment key={(vals && vals.id) || i}>
                    {i > 0 && <Divider />}
                    <PropertyTable form={form} values={vals} />
                </React.Fragment>
            ))}
        </>
    );
}
PropertyTableList.propTypes = {
    form: PropTypes.arrayOf(PropTypes.object),
    values: PropTypes.object,
};
