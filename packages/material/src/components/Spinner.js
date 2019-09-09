import React from 'react';
import Modal from '@material-ui/core/Modal';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useSpinner } from '../hooks';

export default function Spinner() {
    const { active } = useSpinner();
    if (!active) {
        return null;
    }
    // FIXME: text, type
    return (
        <Modal open>
            <CircularProgress />
        </Modal>
    );
}
