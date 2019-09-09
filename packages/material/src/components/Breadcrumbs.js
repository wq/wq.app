import React from 'react';

import Paper from '@material-ui/core/Paper';
import UIBreadcrumbs from '@material-ui/core/Breadcrumbs';
import HomeIcon from '@material-ui/icons/Home';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';

import { makeStyles } from '@material-ui/core/styles';
import {
    useTitle,
    useRouteInfo,
    useReverse,
    useIndexRoute,
    useComponents
} from '../hooks';

const useStyles = makeStyles(theme => ({
    breadcrumbs: {
        padding: theme.spacing(1, 0),
        borderBottom: `1px solid ${theme.palette.divider}`
    },
    icon: {
        verticalAlign: 'middle'
    }
}));

export default function Breadcrumbs() {
    const title = useTitle(),
        { name, page, item_id, mode, full_path } = useRouteInfo(),
        { ButtonLink } = useComponents(),
        reverse = useReverse(),
        index = useIndexRoute(),
        classes = useStyles();

    const links = [];

    const addLink = (url, label, active) =>
        links.push([url, label, active ? 'textPrimary' : 'inherit']);

    // FIXME: NavLink should already be able to detect current page
    const addCurrentPage = label => addLink(full_path, label, true);

    if (name !== index) {
        addLink(reverse(index), <HomeIcon className={classes.icon} />);
        if (item_id) {
            addLink(reverse(`${page}_list`), `${page} list`);
            if (mode !== 'detail') {
                addLink(reverse(`${page}_detail`, item_id), title);
                addCurrentPage(mode);
            } else {
                addCurrentPage(title);
            }
        } else {
            addCurrentPage(title);
        }
    }
    return (
        <Paper elevation={0} className={classes.breadcrumbs} square>
            <UIBreadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                {links.map(([path, label, color], i) => (
                    <ButtonLink key={i} to={path} color={color}>
                        {label}
                    </ButtonLink>
                ))}
            </UIBreadcrumbs>
        </Paper>
    );
}
