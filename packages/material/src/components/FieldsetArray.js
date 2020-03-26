import React from 'react';
import { useComponents } from '@wq/react';
import PropTypes from 'prop-types';

export default function FieldsetArray({ label, children, onAdd }) {
    const { View, Button } = useComponents();
    return (
        <View>
            {children}
            {onAdd && <Button onClick={onAdd}>{`Add ${label}`}</Button>}
        </View>
    );
}

FieldsetArray.propTypes = {
    label: PropTypes.string,
    children: PropTypes.node,
    onAdd: PropTypes.func
};
