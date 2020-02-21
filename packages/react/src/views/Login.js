import React from 'react';
import { useComponents, useInputs, useReverse } from '../hooks';

export default function Login() {
    const reverse = useReverse(),
        { Form, SubmitButton, Link } = useComponents(),
        { default: Input } = useInputs();

    return (
        <>
            <Form
                action="login"
                method="POST"
                storage="temporary"
                backgroundSync={false}
            >
                <Input name="username" label="Username" />
                <Input name="password" type="password" label="Password" />
                <div style={{ display: 'flex' }}>
                    <Link to={reverse('index')}>Cancel</Link>
                    <SubmitButton>Log In</SubmitButton>
                </div>
            </Form>
        </>
    );
}
