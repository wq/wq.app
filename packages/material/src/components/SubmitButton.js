import React from 'react';
import Button from '@material-ui/core/Button';

export default function SubmitButton(props) {
    return (
        <Button color="primary" variant="contained" type="submit" {...props} />
    );
}
