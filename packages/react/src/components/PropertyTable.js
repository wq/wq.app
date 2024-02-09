import React from "react";
import { useComponents } from "../hooks.js";
import PropTypes from "prop-types";

const Value = ({ values, field }) => {
    const {
            FormatJson,
            ImagePreview,
            FileLink,
            ForeignKeyLink,
            ManyToManyLink,
        } = useComponents(),
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
        const id = getForeignKeyId(values, field),
            label = getForeignKeyLabel(values, field);
        return field["type"] === "select" ? (
            <ManyToManyLink
                ids={id}
                labels={label}
                model={field["wq:ForeignKey"]}
            />
        ) : (
            <ForeignKeyLink
                id={id}
                label={label}
                model={field["wq:ForeignKey"]}
            />
        );
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

const getForeignKeyId = (values, field) => {
    const naturalKey = field.name.match(/^([^\]]+)\[([^\]]+)\]$/);
    if (naturalKey) {
        return (values[naturalKey[1]] || {})[naturalKey[2]] || "";
    }
    const value = values[field.name];
    if (value && typeof value === "object" && value.id) {
        return value.id;
    } else if (values[field.name + "_id"]) {
        return values[field.name + "_id"];
    } else {
        return (value || "") + "";
    }
};

const getForeignKeyLabel = (values, field) => {
    const value = values[field.name];
    if (value && typeof value === "object" && value.label) {
        return value.label;
    } else if (values[field.name + "_label"]) {
        return values[field.name + "_label"];
    } else {
        return null;
    }
};

const showInTable = (field) => {
    if (field.show_in_table === false) {
        return false;
    }
    if (field.type && field.type.startsWith("geo")) {
        return field.show_in_table || false;
    }
    return true;
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
                {fields.filter(showInTable).map((field) => (
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
    const { Table, TableHead, TableBody, TableRow, TableTitle, TableCell } =
        useComponents();
    if (!Array.isArray(values) || values.length === 0) {
        return null;
    }
    return (
        <Table>
            <TableHead>
                <TableRow>
                    {form.filter(showInTable).map((field) => (
                        <TableTitle key={field.name}>
                            {field.label || field.name}
                        </TableTitle>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {values.map((vals, i) => (
                    <TableRow key={(vals && vals.id) || i}>
                        {form.filter(showInTable).map((field) => (
                            <TableCell
                                key={field.name}
                                interactive={isInteractive(values, field)}
                            >
                                <Value values={vals} field={field} />
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
PropertyTableList.propTypes = {
    form: PropTypes.arrayOf(PropTypes.object),
    values: PropTypes.object,
};
