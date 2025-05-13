import { Formik } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import * as yup from 'yup';
import api from '../api';
import { RequestError } from '../api/errors';
import { ErrorCode } from '../api/responses';
import { useAsync } from '../../app/hooks';
import FullscreenPage from '../../components/FullscreenPage';
import { branding } from '../../props';
import { useAuth } from './context';
import { saveAccessToken } from '.';

const schema = yup.object().shape({
    login: yup.string().default('').required('Username is required'),
    password: yup.string().default('').required('Password is required'),
});

export default function LoginPage() {
    const formRef = useRef<HTMLFormElement>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const auth = useAuth();

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoginError(null);
        }, 1500);

        return () => {
            clearTimeout(timer);
        };
    }, [loginError]);

    const onError = useCallback((err: unknown) => {
        if (err instanceof RequestError) {
            switch (err.code) {
                case ErrorCode.Unauthorized:
                    setLoginError('Invalid username or password');
                    break;

                case ErrorCode.SetupRequired:
                    auth?.actions.setStatus('setup-required');
                    break;

                default:
                    setLoginError('Unknown error');
                    break;
            }
        }
    }, [auth]);

    const [onValidated, isLoading] = useAsync(useCallback(async (formData: yup.InferType<typeof schema>) => {
        saveAccessToken((await api.users.login(formData.login, formData.password)).accessToken);
        void auth?.actions.refreshMe();
    }, [auth]));

    return (
        <Formik validationSchema={schema} onSubmit={(formData) => { void onValidated(formData).catch(onError); }} initialValues={schema.getDefault()} validateOnChange={false}>
            {({ handleSubmit, handleChange, values, errors }) => (
                <Form
                    noValidate
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubmit();
                    }}
                    ref={formRef}
                >
                    <FullscreenPage
                        title={loginError ?? `Login to ${branding.plain}`}
                        titleVariant={loginError ? 'danger' : undefined}
                        buttons={[
                            // { key: 'forgot-password', content: 'Forgot password?', variant: 'dark', action: 'submit', disabled: isLoading },
                            { key: 'submit', content: 'Sign in', disabled: isLoading },
                        ]}
                    >
                        <Form.Group className="mb-3">
                            <Form.Label className="fs-5">Username</Form.Label>
                            <Form.Control name="login" value={values.login} onChange={handleChange} isInvalid={!!errors.login} disabled={isLoading} />
                            <Form.Control.Feedback type="invalid">
                                {errors.login}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fs-5">Password</Form.Label>
                            <Form.Control type="password" name="password" value={values.password} onChange={handleChange} isInvalid={!!errors.password} disabled={isLoading} />
                            <Form.Control.Feedback type="invalid">
                                {errors.password}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </FullscreenPage>
                </Form>
            )}
        </Formik>
    );
}
