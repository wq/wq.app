import React from 'react';
import { useComponents } from '../hooks';
import PropTypes from 'prop-types';

const Value = ({ values, field }) => {
    const { FormatJson } = useComponents(),
        value = values[field.name];

    if (field['wq:ForeignKey']) {
        if (value && typeof value === 'object' && value.label) {
            return value.label;
        } else {
            return values[field.name + '_label'] || values[field.name + '_id'];
        }
    } else if (typeof value === 'object') {
        return <FormatJson json={value} />;
    } else {
        return value + '';
    }
};

export default function PropertyTable({ form, values }) {
    const { Table, TableBody, TableRow, TableCell } = useComponents();
    return (
        <Table>
            <TableBody>
                {form.map(field => (
                    <TableRow key={field.name}>
                        <TableCell>{field.label || field.name}</TableCell>
                        <TableCell>
                            <Value values={values} field={field} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

PropertyTable.propTypes = {
    form: PropTypes.arrayOf(PropTypes.object),
    values: PropTypes.object
};
