import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
    }
}));

export default function Container({children}) {
    const classes = useStyles();
    return <div className={classes.container}>
        {children}
    </div>;
}
