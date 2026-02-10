import * as yup from 'yup';

export const FormSchema = yup.object().shape({
    login: yup.string().default('').required('Username is required'),
    password: yup.string().default('').required('Password is required'),
    passwordConfirmation: yup
        .string()
        .default('')
        .oneOf([yup.ref('password')], 'Passwords must match'),
});
