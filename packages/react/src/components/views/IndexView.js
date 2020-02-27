import React from 'react';
import { useRenderContext, useReverse, useComponents } from '../../hooks';

export default function Index() {
    const reverse = useReverse(),
        { pages } = useRenderContext(),
        { Link } = useComponents();
    return (
        <>
            <p>
                No view components registered. You may want to import and use
                @wq/material as well.
            </p>
            {pages && (
                <ul>
                    {pages.map(page => (
                        <li key={page.name}>
                            <Link
                                to={
                                    page.list
                                        ? reverse(`${page.name}_list`)
                                        : reverse(page.name)
                                }
                            >
                                {page.name}
                                {page.list && ' list'}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
