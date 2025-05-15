import { Form } from 'react-bootstrap';
import { Formik } from 'formik';
import { forwardRef } from 'react';
import * as yup from 'yup';
import { useProxies } from '../../proxies/context';
import { ConnectionDefinition } from '..';
import { TelegramConfigSchema } from '.';

const schema = yup.object().shape({
    name: yup.string().default('').required('Name should not be empty'),
    config: TelegramConfigSchema.required(),
});

const defaultDefinition = schema.getDefault();
type TelegramConnectionDefinition = yup.InferType<typeof schema>;

const TelegramConfigEditor = forwardRef(({ definition, onValidated, disabled = false }: { definition: ConnectionDefinition | null; disabled?: boolean; onValidated: (definition: ConnectionDefinition) => void }, ref: React.ForwardedRef<HTMLFormElement>) => {
    const proxies = useProxies();

    return (
        <Formik validationSchema={schema} onSubmit={onValidated} initialValues={definition as (TelegramConnectionDefinition | null) ?? defaultDefinition} validateOnChange={false}>
            {({ handleSubmit, handleChange, values, errors }) => (
                <Form
                    noValidate
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubmit();
                    }}
                    ref={ref}
                    className="d-flex flex-column p-2"
                    style={{ gap: '1rem' }}
                >
                    <Form.Group>
                        <Form.Label>Name</Form.Label>
                        <Form.Control name="name" value={values.name} onChange={handleChange} isInvalid={!!errors.name} disabled={disabled} autoComplete="off" />
                        <Form.Text muted>
                            Name is an identifier for the connection. It can be anything as long as it is informative for you.
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                            {errors.name}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Bot Token</Form.Label>
                        <Form.Control type="password" name="config.token" value={values.config.token} onChange={handleChange} isInvalid={!!errors.config?.token} disabled={disabled} autoComplete="off" />
                        <Form.Text muted>
                            Telegram Bot token can be obtained from
                            {' '}
                            <a href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a>
                            .
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                            {errors.config?.token}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group>
                        <Form.Switch name="config.receiveEvents" label="Receive updates" checked={values.config.receiveEvents} onChange={handleChange} isInvalid={!!errors.config?.receiveEvents} disabled={disabled} />
                        <Form.Text muted>
                            If this option is enabled, in addition to allowing the bot to access the Telegram Bot API, it will also keep an active connection and receive new events from Telegram (e.g., messages and commands).
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                            {errors.config?.receiveEvents}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Proxy</Form.Label>
                        <Form.Select name="config.proxyId" value={values.config.proxyId} onChange={handleChange} isInvalid={!!errors.config?.proxyId} disabled={disabled}>
                            <option value="">Don&apos;t use a proxy</option>
                            {
                                proxies?.state.list?.map(proxy => (
                                    <option key={proxy.id} value={proxy.id}>{proxy.name}</option>
                                ))
                            }
                        </Form.Select>
                        <Form.Text muted>
                            Use a proxy server for outgoing connections.
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                            {errors.config?.proxyId}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Form>
            )}
        </Formik>
    );
});

TelegramConfigEditor.displayName = 'TelegramConfigEditor';

export default TelegramConfigEditor;
