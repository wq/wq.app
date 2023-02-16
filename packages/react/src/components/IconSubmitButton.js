import React from "react";
import { useComponents } from "../hooks.js";
import { useFormikContext } from "formik";

export default function IconSubmitButton(props) {
    const { IconButton } = useComponents(),
        { isSubmitting } = useFormikContext();

    return <IconButton type="submit" disabled={isSubmitting} {...props} />;
}
