import React from "react";
import { ActivityIndicator, Modal, Portal } from "react-native-paper";
import { useSpinner } from "@wq/react";

export default function Spinner() {
    const { active } = useSpinner();

    // FIXME: text, type
    return (
        <Portal>
            <Modal visible={active}>
                <ActivityIndicator />
            </Modal>
        </Portal>
    );
}
