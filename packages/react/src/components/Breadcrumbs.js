import React from "react";
import { useComponents } from "../hooks.js";
import PropTypes from "prop-types";

export default function Breadcrumbs({ links }) {
    const { Link } = useComponents();

    if (!links) {
        return null;
    }

    links[links.length - 1].last = true;

    return (
        <div>
            {links.map(({ url, label, last }, i) => (
                <React.Fragment key={i}>
                    <Link key={i} to={url}>
                        {label}
                    </Link>
                    {!last && <> &gt; </>}
                </React.Fragment>
            ))}
        </div>
    );
}

Breadcrumbs.propTypes = {
    links: PropTypes.arrayOf(PropTypes.object),
};
