import React from "react";
import { useComponents } from "@wq/react";

export default function FooterContent() {
    const { Link } = useComponents();
    return (
        <>
            Powered by{" "}
            <Link component="a" href="https://wq.io/" target="_blank">
                wq
            </Link>
        </>
    );
}
