import React from "react";
import { useComponents, Link } from "@wq/react";

export default function ButtonLink(props) {
    const { Button } = useComponents();
    return <Button component={Link} {...props} />;
}
