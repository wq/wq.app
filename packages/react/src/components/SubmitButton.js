import React from 'react';
import { useComponents } from '../hooks';
import { useFormikContext } from 'formik';

export default function SubmitButton(props) {
    const { Button } = useComponents(),
        { isSubmitting } = useFormikContext();

    return <Button type="submit" disabled={isSubmitting} {...props} />;
}
