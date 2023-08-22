import React from "react";
import { Modal, Portal } from "react-native-paper";
import PropTypes from "prop-types";

export default function Popup({ open, onClose, children, ...rest }) {
    return (
        <Portal>
            <Modal visible={open} onDismiss={onClose} {...rest}>
                {children}
            </Modal>
        </Portal>
    );
}

Popup.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    children: PropTypes.node,
};
