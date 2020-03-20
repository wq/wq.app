import React from 'react';
import { useRenderContext, useReverse, useComponents } from '../../hooks';

export default function Index() {
    const reverse = useReverse(),
        { pages } = useRenderContext(),
        { List, ListSubheader, ListItemLink } = useComponents();

    const options = (pages || []).filter(page => !page.list),
        models = (pages || []).filter(page => page.list);

    return (
        <List>
            {models.length && <ListSubheader>Options</ListSubheader>}
            {options.map(page => (
                <ListItemLink key={page.name} to={reverse(page.name)}>
                    {page.name}
                </ListItemLink>
            ))}
            {models.length && <ListSubheader>Content</ListSubheader>}
            {models.map(page => (
                <ListItemLink key={page.name} to={reverse(`${page.name}_list`)}>
                    {page.url}
                </ListItemLink>
            ))}
        </List>
    );
}
