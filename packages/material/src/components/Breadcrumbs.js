import React from 'react';

import Paper from '@material-ui/core/Paper';
import MuiBreadcrumbs from '@material-ui/core/Breadcrumbs';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';

import { makeStyles } from '@material-ui/core/styles';
import { useBreadcrumbs, useReverse, useComponents } from '@wq/react';

const useStyles = makeStyles(theme => ({
    breadcrumbs: {
        padding: theme.spacing(1, 0),
        borderBottom: `1px solid ${theme.palette.divider}`
    }
}));

export default function Breadcrumbs() {
    var links = useBreadcrumbs(),
        reverse = useReverse(),
        classes = useStyles(),
        { ButtonLink, HomeLink } = useComponents();

    if (!links) {
        links = [{ url: reverse('index'), label: 'Home', active: true }];
    }

    // FIXME: NavLink should already be able to detect current page
    links[links.length - 1].active = true;

    return (
        <Paper elevation={0} className={classes.breadcrumbs} square>
            <MuiBreadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                <HomeLink
                    to={links[0].url}
                    label={links[0].label}
                    active={links[0].active}
                />
                {links.slice(1).map(({ url, label, active }, i) => (
                    <ButtonLink
                        key={i}
                        to={url}
                        color={active ? 'inherit' : 'primary'}
                    >
                        {label}
                    </ButtonLink>
                ))}
            </MuiBreadcrumbs>
        </Paper>
    );
}
