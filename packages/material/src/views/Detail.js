import React from 'react';
import Paper from '@material-ui/core/Table';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse
} from '../hooks';

const Value = ({ context, field }) => {
    if (field['wq:ForeignKey']) {
        if (typeof context[field.name] === 'object') {
            return context[field.name].label;
        } else {
            return (
                context[field.name + '_label'] || context[field.name + '_id']
            );
        }
    } else if (typeof context[field.name] !== 'string') {
        return (
            <pre>
                <code>{JSON.stringify(context[field.name], null, 4)}</code>
            </pre>
        );
    } else {
        return context[field.name];
    }
};

export default function Detail() {
    const context = useRenderContext(),
        reverse = useReverse(),
        { page, page_config, item_id } = useRouteInfo(),
        { Link } = useComponents();
    const fields = page_config.form || [{ name: 'label' }];
    return (
        <>
            <Link to={reverse(`${page}_edit`, item_id)}>Edit</Link>
            <Paper>
                <Table>
                    <TableBody>
                        {fields.map(field => (
                            <TableRow key={field.name}>
                                <TableCell>
                                    {field.label || field.name}
                                </TableCell>
                                <TableCell>
                                    <Value context={context} field={field} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </>
    );
}
