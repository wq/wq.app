import React from 'react';
import Modal from '@material-ui/core/Modal';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useSpinner } from '@wq/react';

export default function Spinner() {
    const { active } = useSpinner();

    // FIXME: text, type
    return (
        <Modal open={active}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh'
                }}
            >
                <CircularProgress />
            </div>
        </Modal>
    );
}
