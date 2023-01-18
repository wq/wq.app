import React from "react";
import { useComponents, useMessages } from "@wq/react";
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
                <SubmitButton icon="delete" variant="text" color="secondary">
                    Delete
                </SubmitButton>
            </HorizontalView>
        </Form>
    );
}

DeleteForm.propTypes = {
    action: PropTypes.string,
};
