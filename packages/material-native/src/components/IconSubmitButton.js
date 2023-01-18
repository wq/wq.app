import React from "react";
import { useComponents } from "@wq/react";
import { useFormikContext } from "formik";

export default function IconSubmitButton(props) {
    const { IconButton } = useComponents(),
        { isSubmitting, submitForm } = useFormikContext();

    return (
        <IconButton disabled={isSubmitting} onPress={submitForm} {...props} />
    );
}
