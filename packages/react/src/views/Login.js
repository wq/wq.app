import React from 'react';
import { useComponents, useInputComponents, useReverse } from '../hooks';

export default function Login() {
    const reverse = useReverse(),
        {
            Form,
            FormError,
            FormActions,
            ButtonLink,
            SubmitButton
        } = useComponents(),
        { Input } = useInputComponents();

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
                <FormError />
                <FormActions>
                    <ButtonLink to={reverse('index')}>Cancel</ButtonLink>
                    <SubmitButton>Submit</SubmitButton>
                </FormActions>
            </Form>
        </>
    );
}
