import React from "react";
import { useComponents } from "../hooks.js";

export default function Footer() {
    const { FooterContent } = useComponents();
    return (
        <center>
            <small>
                <FooterContent />
            </small>
        </center>
    );
}
