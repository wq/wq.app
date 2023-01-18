import React from "react";
import { useComponents } from "@wq/react";

export default function SubmitButton(props) {
    const { Button } = useComponents();
    return (
        <Button color="primary" variant="contained" type="submit" {...props} />
    );
}
