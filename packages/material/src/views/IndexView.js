import React from 'react';
import List from '@material-ui/core/List';
import { useRenderContext, useComponents, useReverse } from '../hooks';

export default function Index() {
    const { pages } = useRenderContext(),
        { ListItemLink } = useComponents(),
        reverse = useReverse();

    return (
        <List>
            {pages.map(page => (
                <ListItemLink
                    key={page.name}
                    to={
                        page.list
                            ? reverse(`${page.name}_list`)
                            : reverse(page.name)
                    }
                >
                    {page.name}
                    {page.list && ' list'}
                </ListItemLink>
            ))}
        </List>
    );
}
