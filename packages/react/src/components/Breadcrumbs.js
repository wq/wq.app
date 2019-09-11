import React from 'react';
import { useBreadcrumbs, useComponents } from '../hooks';

export default function Breadcrumbs() {
    const links = useBreadcrumbs(),
        { Link } = useComponents();

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
