import React from "react";
import { useRenderContext, useComponents } from "../hooks.js";

export default function Pagination() {
    const { Link } = useComponents(),
        {
            multiple,
            page: pageNum,
            pages,
            per_page,
            previous,
            next,
            previous_is_local,
            current_is_local,
        } = useRenderContext();

    if (!(multiple && pages && per_page)) {
        return null;
    }

    return (
        <p>
            {previous && (
                <Link to={previous}>
                    &lt;{" "}
                    {previous_is_local ? "Local Cache" : `Previous ${per_page}`}
                </Link>
            )}
            {!current_is_local && (
                <>
                    Page {pageNum} of {pages}
                </>
            )}
            {next && (
                <Link to={next}>
                    {current_is_local ? "All Data" : `Next ${per_page}`} &gt;
                </Link>
            )}
        </p>
    );
}
