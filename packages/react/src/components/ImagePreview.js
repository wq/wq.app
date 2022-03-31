import React, { useState } from 'react';
import { useComponents } from '../hooks';
import PropTypes from 'prop-types';

export default function ImagePreview({ value }) {
    const [open, setOpen] = useState(false),
        { View, Popup, Image } = useComponents();
    if (!value) {
        return null;
    }
    const label = value.split('/').reverse()[0];
    return (
        <>
            <Image
                src={value}
                alt={label}
                style={{ maxHeight: 200, cursor: 'pointer' }}
                onClick={() => setOpen(true)}
            />
            <Popup open={open} onClose={() => setOpen(false)}>
                <View
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        padding: 8
                    }}
                >
                    <Image
                        src={value}
                        alt={label}
                        style={{
                            maxWidth: '95vw',
                            maxHeight: '90vh'
                        }}
                    />
                </View>
            </Popup>
        </>
    );
}

ImagePreview.propTypes = {
    value: PropTypes.string
};
