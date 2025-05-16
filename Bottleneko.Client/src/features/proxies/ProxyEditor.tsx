import * as yup from 'yup';
import { useEffect, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import { Formik } from 'formik';
import ModalDialog from '../../components/ModalDialog';
import { ProxyDto, ProxyType } from '../api/dtos.gen';
import ProxyTypePicker from './ProxyTypePicker';

const schema = yup.object().shape({
    name: yup.string().label('Name').required(),
    type: yup.mixed<ProxyType>().oneOf(Object.values(ProxyType)).required(),
    hostname: yup.string().label('Hostname').required(),
    port: yup.number().label('Port').min(1).max(65535).required(),
    isAuthRequired: yup.boolean(),
    username: yup.string().label('Username').when('isAuthRequired', {
        is: true,
        then: schema => schema.required(),
    }),
    password: yup.string().label('Password').when(['isAuthRequired', 'type'], {
        is: (isAuthRequired: boolean, type: ProxyType) => isAuthRequired && type !== ProxyType.Socks4 && type !== ProxyType.Socks4a,
        then: schema => schema.required(),
    }),
});

type ProxyEditorStage =
    { id: 'select-type'; type: ProxyType } |
    { id: 'edit'; proxy: ProxyDto; isNew: boolean };

export default function ProxyEditor({ show, proxy, onSuccess, onCancel }: { show: boolean; proxy: ProxyDto | null; onSuccess: (proxy: ProxyDto) => void; onCancel: () => void }) {
    const [stage, setStage] = useState<ProxyEditorStage>({ id: 'select-type', type: ProxyType.Http });

    const formRef = useRef<HTMLFormElement>(null);

    const oldShowRef = useRef(false);
    useEffect(() => {
        if (show && !oldShowRef.current) {
            setStage(proxy ? { id: 'edit', proxy, isNew: false } : { id: 'select-type', type: ProxyType.Http });
        }
        oldShowRef.current = show;
    }, [stage, show, proxy]);

    switch (stage.id) {
        case 'select-type':
            return (
                <ModalDialog
                    header="Proxy type"
                    show={show}
                    buttons={[
                        { key: 'back', text: 'Back', onClick: () => { onCancel(); }, props: { variant: 'secondary' } },
                        { key: 'next', text: 'Next', onClick: () => { setStage({ id: 'edit', proxy: { id: '', name: '', hostname: '', port: 1080, type: stage.type, isAuthRequired: false, username: '', password: '' }, isNew: true }); } },
                    ]}
                    onCancel={onCancel}
                >
                    <ProxyTypePicker
                        type={stage.type}
                        onChange={(type) => { setStage({ ...stage, type }); }}
                    />
                </ModalDialog>
            );
            break;

        case 'edit':
            return (
                <ModalDialog
                    header="Proxy configuration"
                    show={show}
                    buttons={[
                        {
                            key: 'back',
                            text: 'Back',
                            onClick: () => {
                                if (stage.isNew) {
                                    setStage({ id: 'select-type', type: stage.proxy.type });
                                }
                                else {
                                    onCancel();
                                }
                            },
                            props: { variant: 'secondary' } },
                        { key: 'save', text: 'Save', onClick: () => { formRef.current?.requestSubmit(); } },
                    ]}
                    onCancel={onCancel}
                >
                    <Formik validationSchema={schema} onSubmit={(proxy) => { onSuccess(proxy); }} initialValues={stage.proxy} enableReinitialize={true} validateOnChange={false}>
                        {({ handleSubmit, handleChange, values, setFieldValue, errors }) => (
                            <Form
                                noValidate
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSubmit();
                                }}
                                className="d-flex flex-column p-2"
                                style={{ gap: '1rem' }}
                                ref={formRef}
                            >
                                <Form.Group>
                                    <Form.Label>Proxy name</Form.Label>
                                    <Form.Control name="name" value={values.name} onChange={handleChange} isInvalid={!!errors.name} autoComplete="off" />
                                    <Form.Text muted>
                                        Description for the proxy
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group>
                                    <Form.Label>Hostname</Form.Label>
                                    <Form.Control name="hostname" value={values.hostname} onChange={handleChange} isInvalid={!!errors.hostname} autoComplete="off" />
                                    <Form.Text muted>
                                        Hostname or IP address of the proxy
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.hostname}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group>
                                    <Form.Label>Port</Form.Label>
                                    <Form.Control name="port" type="number" value={values.port} onChange={handleChange} isInvalid={!!errors.port} autoComplete="off" />
                                    <Form.Text muted>
                                        Port of the proxy
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.port}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Switch
                                    name="isAuthRequired"
                                    label="Use authentication"
                                    checked={values.isAuthRequired}
                                    onChange={() => { void setFieldValue('isAuthRequired', !values.isAuthRequired); }}
                                />
                                <Form.Group>
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control name="username" value={values.username} onChange={handleChange} isInvalid={!!errors.username} autoComplete="off" disabled={!values.isAuthRequired} />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.username}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                {
                                    values.type !== ProxyType.Socks4 && values.type !== ProxyType.Socks4a
                                        ? (
                                                <Form.Group>
                                                    <Form.Label>Password</Form.Label>
                                                    <Form.Control name="password" type="password" value={values.password} onChange={handleChange} isInvalid={!!errors.password} autoComplete="off" disabled={!values.isAuthRequired} />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.password}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            )
                                        : <></>
                                }
                            </Form>
                        )}
                    </Formik>
                </ModalDialog>
            );

        default:
            return <></>;
    }
}
