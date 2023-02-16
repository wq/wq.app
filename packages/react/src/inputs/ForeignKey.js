import React from "react";
import { useModel, useUnsynced, useInputComponents } from "../hooks.js";
import { useFormikContext, getIn } from "formik";

function useChoices(modelName, group_by) {
    const records = useModel(modelName),
        unsyncedItems = useUnsynced(modelName),
        getGroup = (record) => (group_by && record[group_by]) || null;

    return unsyncedItems
        .map((item) => ({
            name: "outbox-" + item.id,
            label: `* ${item.label}`,
            group: getGroup(item.data),
            data: item.data,
        }))
        .concat(
            records.map((record) => ({
                name: record.id,
                label: record.label,
                group: getGroup(record),
                data: record,
            }))
        );
}

function useFilteredChoices(modelName, group_by, filterConf) {
    const choices = useChoices(modelName, group_by),
        { values } = useFormikContext(),
        filter = {};

    Object.entries(filterConf).forEach(([key, value]) => {
        filter[key] = getIn(values, value);
    });
    return choices.filter((choice) =>
        Object.entries(filter).every(([key, value]) => {
            return choice.data[key] == value;
        })
    );
}

function useSelectInput(component) {
    const inputs = useInputComponents(),
        { Select } = inputs;
    let Component;
    if (typeof component === "string") {
        Component = inputs[component];
        if (!Component) {
            Component = function UnknownInput(props) {
                return (
                    <Select
                        {...props}
                        hint={`Unknown input type "${component}"`}
                    />
                );
            };
        }
    } else if (component) {
        Component = component;
    } else {
        Component = Select;
    }
    return Component;
}

export default function ForeignKey({ filter, ...rest }) {
    if (filter) {
        return <FilteredForeignKey filter={filter} {...rest} />;
    } else {
        return <UnfilteredForeignKey {...rest} />;
    }
}

function FilteredForeignKey({
    ["wq:ForeignKey"]: modelName,
    group_by,
    filter,
    component,
    ...rest
}) {
    const choices = useFilteredChoices(modelName, group_by, filter),
        Select = useSelectInput(component);
    return <Select {...rest} choices={choices} />;
}

function UnfilteredForeignKey({
    ["wq:ForeignKey"]: modelName,
    group_by,
    component,
    ...rest
}) {
    const choices = useChoices(modelName, group_by),
        Select = useSelectInput(component);
    return <Select {...rest} choices={choices} />;
}
