import React from 'react';
import MuiList from '@material-ui/core/List';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    list: {
        backgroundColor: theme.palette.background.paper
    }
}));

export default function List(props) {
    const classes = useStyles();
    return <MuiList className={classes.list} {...props} />;
}
