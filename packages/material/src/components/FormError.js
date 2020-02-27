import React from 'react';
import { FormError as RFormError } from '@wq/react';
import FormHelperText from '@material-ui/core/FormHelperText';

export default function FormError(props) {
    return <RFormError error component={FormHelperText} {...props} />;
}
