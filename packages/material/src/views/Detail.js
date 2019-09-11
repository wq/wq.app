import React from 'react';
import Paper from '@material-ui/core/Table';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Grid from '@material-ui/core/Grid';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse,
    usePluginContent
} from '@wq/react';

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

function PropertyTable() {
    const context = useRenderContext(),
        { page_config } = useRouteInfo(),
        fields = page_config.form || [{ name: 'label' }];
    return (
        <Paper>
            <Table>
                <TableBody>
                    {fields.map(field => (
                        <TableRow key={field.name}>
                            <TableCell>{field.label || field.name}</TableCell>
                            <TableCell>
                                <Value context={context} field={field} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
}

export default function Detail() {
    const reverse = useReverse(),
        PluginContent = usePluginContent(),
        { page, item_id } = useRouteInfo(),
        { Link } = useComponents();
    return PluginContent ? (
        <Grid container>
            <Grid item xs={6}>
                <Link to={reverse(`${page}_edit`, item_id)}>Edit</Link>
                <PropertyTable />
            </Grid>
            <Grid item xs={6}>
                <PluginContent />
            </Grid>
        </Grid>
    ) : (
        <>
            <Link to={reverse(`${page}_edit`, item_id)}>Edit</Link>
            <PropertyTable />
        </>
    );
}
