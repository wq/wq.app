import React from 'react';
import { FormError as RFormError } from '@wq/react';
import { HelperText } from 'react-native-paper';

export default function FormError(props) {
    return <RFormError type="error" component={HelperText} {...props} />;
}
