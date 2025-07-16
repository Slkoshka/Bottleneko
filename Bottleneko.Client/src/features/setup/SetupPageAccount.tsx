import { Formik } from 'formik';
import { Alert, Form } from 'react-bootstrap';
import * as yup from 'yup';
import { useCallback } from 'react';
import FullscreenPage from '../../components/fullscreen-page/FullscreenPage';
import { SetupStage } from './SetupPageView';
import SetupPage from './SetupPage';

const schema = yup.object().shape({
    login: yup.string().default('').required('Username is required'),
    password: yup.string().default('').required('Password is required'),
    passwordConfirmation: yup.string().default('').oneOf([yup.ref('password')], 'Passwords must match'),
});

export default function SetupPageAccount({ progress, setStage }: { progress: number; setStage: (stage: SetupStage) => void }) {
    const onValidated = useCallback((formData: yup.InferType<typeof schema>) => {
        setStage({ stage: 'initialization', account: { login: formData.login, password: formData.password } });
    }, [setStage]);

    return (
        <Formik validationSchema={schema} onSubmit={(formData) => { onValidated(formData); }} initialValues={schema.getDefault()} validateOnChange={false}>
            {({ handleSubmit, handleChange, values, errors }) => (
                <Form
                    noValidate
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubmit();
                    }}
                >
                    <SetupPage title="Create an account" variant="normal" progress={progress}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fs-5">Username</Form.Label>
                            <Form.Control name="login" value={values.login} onChange={handleChange} isInvalid={!!errors.login} />
                            <Form.Control.Feedback type="invalid">
                                {errors.login}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fs-5">Password</Form.Label>
                            <Form.Control type="password" name="password" value={values.password} onChange={handleChange} isInvalid={!!errors.password} />
                            <Form.Control.Feedback type="invalid">
                                {errors.password}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fs-5">Confirm password</Form.Label>
                            <Form.Control type="password" name="passwordConfirmation" value={values.passwordConfirmation} onChange={handleChange} isInvalid={!!errors.passwordConfirmation} />
                            <Form.Control.Feedback type="invalid">
                                {errors.passwordConfirmation}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <hr />

                        <Alert variant="dark">
                            You&apos;ll be able to create additional accounts after completing the initial setup.
                        </Alert>

                        <FullscreenPage.Button action="submit">
                            Next
                        </FullscreenPage.Button>
                    </SetupPage>
                </Form>
            )}
        </Formik>
    );
}
