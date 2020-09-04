import React from 'react';
import { useComponents, useInputComponents, useReverse } from '../../hooks';

export default function Login() {
    const reverse = useReverse(),
        {
            Message,
            Form,
            FormError,
            HorizontalView,
            CancelButton,
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
                    <CancelButton to={reverse('index')}>
                        <Message id="CANCEL" />
                    </CancelButton>
                    <SubmitButton>
                        <Message id="SUBMIT" />
                    </SubmitButton>
                </HorizontalView>
            </Form>
        </>
    );
}
