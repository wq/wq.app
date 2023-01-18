import { useField } from "formik";

export default function FormError() {
    const [, { error }] = useField("__other__");
    if (!error) {
        return null;
    }
    return error;
}
