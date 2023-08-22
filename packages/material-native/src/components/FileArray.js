import React from "react";
import { List } from "react-native-paper";
import FieldsetArray from "./FieldsetArray.js";

export default function FileArray(props) {
    return (
        <>
            {props.label && <List.Subheader>{props.label}</List.Subheader>}
            <FieldsetArray {...props} />
        </>
    );
}
