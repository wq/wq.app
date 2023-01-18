import React from "react";
import { useComponents } from "@wq/react";

export default function IconSubmitButton(props) {
    const { IconButton } = useComponents();
    return <IconButton type="submit" {...props} />;
}
