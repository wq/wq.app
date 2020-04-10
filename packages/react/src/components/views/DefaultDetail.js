import React from 'react';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse
} from '../../hooks';

const Value = ({ context, field }) => {
    const { FormatJson } = useComponents();

    if (field['wq:ForeignKey']) {
        if (context[field.name] && typeof context[field.name] === 'object') {
            return context[field.name].label;
        } else {
            return (
                context[field.name + '_label'] || context[field.name + '_id']
            );
        }
    } else if (typeof context[field.name] !== 'string') {
        return <FormatJson json={context[field.name]} />;
    } else {
        return context[field.name];
    }
};

function PropertyTable() {
    const context = useRenderContext(),
        { Table, TableBody, TableRow, TableCell } = useComponents(),
        { page_config } = useRouteInfo(),
        fields = page_config.form || [{ name: 'label' }];
    return (
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
    );
}

export default function DefaultDetail() {
    const reverse = useReverse(),
        { page, item_id } = useRouteInfo(),
        { ScrollView, Fab } = useComponents(),
        editUrl = reverse(`${page}_edit`, item_id);
    return (
        <>
            <ScrollView>
                <PropertyTable />
            </ScrollView>
            <Fab icon="edit" to={editUrl} />
        </>
    );
}
