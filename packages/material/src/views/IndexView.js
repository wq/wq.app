import React from 'react';
import List from '@material-ui/core/List';
import {
    useRenderContext,
    useComponents,
    useReverse,
    usePluginContent
} from '@wq/react';

export default function Index() {
    const reverse = useReverse(),
        PluginContent = usePluginContent(),
        { pages } = useRenderContext(),
        { ListItemLink } = useComponents();

    return (
        <>
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
            {PluginContent && <PluginContent />}
        </>
    );
}
