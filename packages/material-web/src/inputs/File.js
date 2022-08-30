import React, { useMemo, useCallback, useRef } from 'react';
import { useField } from 'formik';
import { DropzoneArea } from '../vendor/material-ui-dropzone.js';
import InputLabel from '@material-ui/core/InputLabel';
import HelperText from './HelperText';
import PropTypes from 'prop-types';

export default function File({ name, accept, hint, label }) {
    const [, { initialValue }, { setValue }] = useField(name),
        loadedRef = useRef(null);

    const initialFiles = useMemo(() => {
            if (!initialValue || initialValue === '__clear__') {
                return [];
            } else if (initialValue.type && initialValue.body) {
                return [initialValue.body];
            } else if (typeof initialValue === 'string') {
                return [initialValue];
            }
        }, [initialValue]),
        acceptedFiles = useMemo(() => (accept ? accept.split(',') : null), [
            accept
        ]),
        setFile = useCallback(
            files => {
                if (!loadedRef.current) {
                    // Component mounted
                    loadedRef.current = -1;
                    return;
                } else if (loadedRef.current === -1) {
                    // initialFiles loaded
                    loadedRef.current = files && files.length ? files[0] : true;
                    return;
                }
                if (files && files.length) {
                    if (files[0] !== loadedRef.current) {
                        const { name, type } = files[0];
                        setValue({
                            name,
                            type,
                            body: files[0]
                        });
                    }
                } else if (initialValue) {
                    setValue('__clear__');
                } else {
                    setValue(null);
                }
            },
            [initialValue]
        );

    return (
        <>
            <InputLabel shrink>{label}</InputLabel>
            <DropzoneArea
                initialFiles={initialFiles}
                acceptedFiles={acceptedFiles}
                onChange={setFile}
                filesLimit={1}
                maxFileSize={100000000}
            />
            <HelperText name={name} hint={hint} />
        </>
    );
}

File.propTypes = {
    name: PropTypes.string,
    accept: PropTypes.string,
    label: PropTypes.string,
    hint: PropTypes.string
};
