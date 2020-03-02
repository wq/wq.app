import React from 'react';
import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import { useRenderContext, useComponents, useReverse } from '@wq/react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    list: {
        backgroundColor: theme.palette.background.paper
    }
}));

export default function Index() {
    const reverse = useReverse(),
        { pages } = useRenderContext(),
        { ListItemLink } = useComponents(),
        classes = useStyles();

    return (
        <div>
            {pages && (
                <List className={classes.list}>
                    <ListSubheader>Options</ListSubheader>
                    {pages
                        .filter(page => !page.list)
                        .map(page => (
                            <ListItemLink
                                key={page.name}
                                to={reverse(page.name)}
                            >
                                {page.name}
                            </ListItemLink>
                        ))}
                    <ListSubheader>Content</ListSubheader>
                    {pages
                        .filter(page => page.list)
                        .map(page => (
                            <ListItemLink
                                key={page.name}
                                to={reverse(`${page.name}_list`)}
                            >
                                {page.url}
                            </ListItemLink>
                        ))}
                </List>
            )}
        </div>
    );
}
