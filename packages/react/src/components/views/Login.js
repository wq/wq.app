import React from 'react';
import { useComponents, useInputComponents, useReverse } from '../../hooks';

export default function Login() {
    const reverse = useReverse(),
        {
            Form,
            FormError,
            HorizontalView,
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
                <HorizontalView>
                    <ButtonLink to={reverse('index')}>Cancel</ButtonLink>
                    <SubmitButton>Submit</SubmitButton>
                </HorizontalView>
            </Form>
        </>
    );
}
