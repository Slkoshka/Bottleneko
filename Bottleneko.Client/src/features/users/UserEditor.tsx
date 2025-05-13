import { Formik } from 'formik';
import * as yup from 'yup';
import { Button, Form } from 'react-bootstrap';
import { UserDto } from '../api/dtos.gen';

export const EditedUserSchema = yup.object().shape({
    login: yup.string().default('').required('Username cannot be empty'),
    password: yup.string().default(''),
});

export type EditedUser = yup.InferType<typeof EditedUserSchema>;

export default function UserEditor({ user, loading = false, newUser, onValidated }: { user?: UserDto; newUser: boolean; loading: boolean; onValidated?: (formData: EditedUser) => void }) {
    return (
        <Formik validationSchema={EditedUserSchema} onSubmit={onValidated ?? ((_) => { void _; })} initialValues={user ? { login: user.displayName, password: '' } : EditedUserSchema.getDefault()} validateOnChange={false}>
            {({ handleSubmit, handleChange, values, errors }) => (
                <Form
                    noValidate
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubmit();
                    }}
                >
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control name="login" value={values.login} onChange={handleChange} isInvalid={!!errors.login} disabled={loading} autoComplete="off" />
                        <Form.Text muted>
                            Usernames are case-insensitive and must be unique among all users.
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                            {errors.login}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>{newUser ? 'Password' : 'New Password'}</Form.Label>
                        <Form.Control name="password" type="password" value={values.password} onChange={handleChange} isInvalid={!!errors.password} disabled={loading} autoComplete="off" />
                        {
                            newUser
                                ? <></>
                                : (
                                        <Form.Text muted>
                                            Leave empty to keep the current password.
                                        </Form.Text>
                                    )
                        }
                        <Form.Control.Feedback type="invalid">
                            {errors.password}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <hr />

                    <div className="d-flex justify-content-center">
                        <Button size="lg" style={{ width: 'min(15%, 400px)', minWidth: '200px' }} type="submit" disabled={loading}>{newUser ? 'Add' : 'Save'}</Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
}
