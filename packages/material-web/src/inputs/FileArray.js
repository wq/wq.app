import React, { useMemo, useCallback, useRef } from "react";
import { useField } from "formik";
import * as MuiFileDropzone from "mui-file-dropzone";
import Fieldset from "./Fieldset.js";
import HelperText from "../inputs/HelperText.js";
import PropTypes from "prop-types";

const { DropzoneArea } = MuiFileDropzone;

export default function FileArray({ name, label, subform, hint, maxRows }) {
    const [, { initialValue = [] }, { setValue }] = useField(name),
        fileField = subform.find(
            (field) => field.type === "file" || field.type === "image"
        ) || {
            name: "file",
            type: "file",
        },
        accept = fileField.type === "image" ? "image/*" : null,
        loadedRef = useRef(null);

    const initialFiles = useMemo(() => {
            if (!initialValue || initialValue.length === 0) {
                return [];
            }
            return initialValue
                .filter((row) => {
                    if (
                        !row[fileField.name] ||
                        row[fileField.name] === "__clear__"
                    ) {
                        return false;
                    }
                    return true;
                })
                .map((row) => {
                    const value = row[fileField.name];
                    if (value.type && value.body) {
                        return value.body;
                    } else if (typeof value === "string") {
                        return value;
                    }
                });
        }, [initialValue]),
        acceptedFiles = useMemo(
            () => (accept ? accept.split(",") : null),
            [accept]
        ),
        setFiles = useCallback(
            (files) => {
                if (!loadedRef.current) {
                    // initialFiles loaded
                    let fileIndex = 0;
                    loadedRef.current = initialValue.map((row) => {
                        let file;
                        if (
                            row[fileField.name] &&
                            row[fileField.name] !== "__clear__"
                        ) {
                            file = files[fileIndex];
                            fileIndex++;
                        }
                        return { row, file };
                    });
                    return;
                }
                const nextValue = files.map((file, i) => {
                    const { row, file: initialFile } = loadedRef.current[i] || {
                        row: {},
                        file: null,
                    };
                    if (initialFile === file) {
                        return row;
                    } else {
                        return {
                            ...row,
                            [fileField.name]: {
                                name: file.name,
                                type: file.type,
                                body: file,
                            },
                        };
                    }
                });
                if (initialValue && nextValue.length < initialValue.length) {
                    initialValue.slice(nextValue.length).forEach((row) => {
                        nextValue.push({
                            ...row,
                            [fileField.name]: "__clear__",
                        });
                    });
                }
                setValue(nextValue);
            },
            [initialValue]
        );

    return (
        <Fieldset label={label}>
            <DropzoneArea
                initialFiles={initialFiles}
                acceptedFiles={acceptedFiles}
                onChange={setFiles}
                filesLimit={maxRows}
            />
            <HelperText name={name} hint={hint} />
        </Fieldset>
    );
}

FileArray.Fieldset = function EmptyFieldset() {
    return null;
};

FileArray.propTypes = {
    name: PropTypes.string,
    accept: PropTypes.string,
    label: PropTypes.string,
    subform: PropTypes.arrayOf(PropTypes.object),
    hint: PropTypes.string,
    maxRows: PropTypes.number,
};
