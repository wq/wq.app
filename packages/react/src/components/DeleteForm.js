import React from "react";
import { useComponents, useMessages } from "../hooks.js";
import PropTypes from "prop-types";

export default function DeleteForm({ action }) {
    const { Form, SubmitButton, View, HorizontalView } = useComponents(),
        { CONFIRM_DELETE } = useMessages();

    function confirmSubmit() {
        return window.confirm(CONFIRM_DELETE);
    }

    return (
        <Form
            action={action}
            method="DELETE"
            backgroundSync={false}
            onSubmit={confirmSubmit}
        >
            <HorizontalView>
                <View />
                <SubmitButton>Delete</SubmitButton>
            </HorizontalView>
        </Form>
    );
}

DeleteForm.propTypes = {
    action: PropTypes.string,
};
