import React from "react";
import Input from "./Input.js";

export default function DateTime({ InputLabelProps: overrides, ...rest }) {
    const InputLabelProps = {
        shrink: true,
        ...overrides,
    };
    return <Input InputLabelProps={InputLabelProps} {...rest} />;
}
