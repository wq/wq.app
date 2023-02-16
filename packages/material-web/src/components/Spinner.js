import React from "react";
import { Modal, CircularProgress } from "@mui/material";
import { useSpinner } from "@wq/react";

export default function Spinner() {
    const { active } = useSpinner();

    // FIXME: text, type
    return (
        <Modal open={active}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                }}
            >
                <CircularProgress />
            </div>
        </Modal>
    );
}
