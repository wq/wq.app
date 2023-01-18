import React from "react";
import Alert from "react-native";
import { useComponents, useMessages } from "@wq/react";
import PropTypes from "prop-types";

export default function DeleteForm({ action }) {
    const { Form, SubmitButton, View, HorizontalView } = useComponents(),
        {
            CONFIRM_DELETE,
            CONFIRM_DELETE_TITLE,
            CONFIRM_DELETE_OK,
            CONFIRM_DELETE_CANCEL,
        } = useMessages();

    async function confirmSubmit() {
        return new Promise((resolve) => {
            Alert.alert(
                CONFIRM_DELETE_TITLE,
                CONFIRM_DELETE,
                [
                    {
                        text: CONFIRM_DELETE_CANCEL,
                        onPress() {
                            resolve(false);
                        },
                        style: "cancel",
                    },
                    {
                        text: CONFIRM_DELETE_OK,
                        onPress() {
                            resolve(true);
                        },
                        style: "destructive",
                    },
                ],
                {
                    onDismiss() {
                        resolve(false);
                    },
                }
            );
        });
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
