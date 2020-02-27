import React from 'react';
import { Field, ErrorMessage } from 'formik';
import PropTypes from 'prop-types';

const HTML5_INPUT_TYPES = {
    // Map XForm field types to <input type>
    barcode: false,
    binary: 'file',
    date: 'date',
    dateTime: 'datetime-local',
    decimal: 'number',
    geopoint: false,
    geoshape: false,
    geotrace: false,
    int: 'number',
    select: false,
    select1: false,
    string: 'text',
    time: 'time',

    // String subtypes
    password: 'password',
    email: 'email',
    phone: 'tel',
    text: false,
    note: false
};

export default function Input({ type, name, label }) {
    const htmlType = HTML5_INPUT_TYPES[type] || 'text';
    return (
        <div style={{ marginBottom: '0.5em' }}>
            <div style={{ display: 'flex' }}>
                <label htmlFor={name} style={{ width: '25%' }}>
                    {label}
                </label>
                <Field style={{ flex: 1 }} name={name} type={htmlType} />
            </div>
            <ErrorMessage name={name} />
        </div>
    );
}

Input.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string
};
