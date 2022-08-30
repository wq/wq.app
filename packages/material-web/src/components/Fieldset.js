import React from 'react';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import CardContent from '@material-ui/core/CardContent';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const useStyles = makeStyles({
    card: {
        marginBottom: '1em'
    }
});

export default function Fieldset({ label, children }) {
    const classes = useStyles();
    return (
        <Card className={classes.card}>
            <CardContent>
                <Typography color="textSecondary">{label}</Typography>
                {children}
            </CardContent>
        </Card>
    );
}

Fieldset.propTypes = {
    label: PropTypes.string,
    children: PropTypes.node
};
