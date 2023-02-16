import React from "react";
import {
    useComponents,
    useInputComponents,
    useReverse,
    useRenderContext,
} from "../hooks.js";

export default function Login() {
    const reverse = useReverse(),
        {
            Message,
            Form,
            FormError,
            HorizontalView,
            CancelButton,
            SubmitButton,
            View,
            Text,
            ButtonLink,
        } = useComponents(),
        { Input } = useInputComponents(),
        { is_authenticated, user } = useRenderContext();

    if (is_authenticated) {
        return (
            <View>
                <Text>Logged in as {user.label || user.username}</Text>
                <HorizontalView>
                    <ButtonLink to={reverse("logout")}>Log Out</ButtonLink>
                    <ButtonLink to={reverse("index")}>
                        Return to Home
                    </ButtonLink>
                </HorizontalView>
            </View>
        );
    }
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
                    <CancelButton to={reverse("index")}>
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
