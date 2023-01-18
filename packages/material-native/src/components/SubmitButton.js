import React from "react";
import { useComponents } from "@wq/react";
import { useFormikContext } from "formik";

export default function SubmitButton(props) {
    const { Button } = useComponents(),
        { isSubmitting, submitForm } = useFormikContext();

    return (
        <Button
            mode="contained"
            disabled={isSubmitting}
            onPress={submitForm}
            {...props}
        />
    );
}
