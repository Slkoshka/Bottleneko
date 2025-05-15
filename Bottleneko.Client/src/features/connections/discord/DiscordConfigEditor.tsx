import { Card, Form } from 'react-bootstrap';
import { Formik } from 'formik';
import { forwardRef } from 'react';
import * as yup from 'yup';
import { useProxies } from '../../proxies/context';
import { ConnectionDefinition } from '..';
import { DiscordConfigSchema } from '.';

const schema = yup.object().shape({
    name: yup.string().default('').required('Name should not be empty'),
    config: DiscordConfigSchema.required(),
});

const defaultDefinition = schema.getDefault();
type DiscordConnectionDefinition = yup.InferType<typeof schema>;

const DiscordConfigEditor = forwardRef(({ definition, onValidated, disabled = false }: { definition: ConnectionDefinition | null; disabled?: boolean; onValidated: (definition: ConnectionDefinition) => void }, ref: React.ForwardedRef<HTMLFormElement>) => {
    const proxies = useProxies();

    return (
        <Formik validationSchema={schema} onSubmit={onValidated} initialValues={definition as (DiscordConnectionDefinition | null) ?? defaultDefinition} validateOnChange={false}>
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
                            Discord Bot token can be obtained from the
                            {' '}
                            <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer">Discord Developer Portal</a>
                            .
                            You can read more about registering a new application
                            {' '}
                            <a href="https://discord.com/developers/docs/quick-start/getting-started#step-1-creating-an-app" target="_blank" rel="noreferrer">here</a>
                            .
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                            {errors.config?.token}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group>
                        <Form.Switch name="config.receiveEvents" label="Receive updates" checked={values.config.receiveEvents} onChange={handleChange} isInvalid={!!errors.config?.receiveEvents} disabled={disabled} />
                        <Form.Text muted>
                            If this option is enabled, in addition to allowing the bot to access the Discord API, it will also keep an active WebSocket connection and receive new events from Discord (e.g., messages and commands).
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                            {errors.config?.receiveEvents}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Card>
                        <Card.Header className="fw-bold">Privileged gateway intents</Card.Header>
                        <Card.Body className="d-flex flex-column p-3" style={{ gap: '1rem' }}>
                            <Form.Group>
                                <Form.Switch name="config.isPresenceIntentEnabled" label="Enable presence intent" checked={values.config.isPresenceIntentEnabled} onChange={handleChange} isInvalid={!!errors.config?.isPresenceIntentEnabled} disabled={disabled} />
                                <Form.Text muted>
                                    Required for your bot to receive Presence Update events. A user&apos;s presence is their current state on a server. This event is sent when a user&apos;s presence or info, such as name or avatar, is updated.
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.config?.isPresenceIntentEnabled}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group>
                                <Form.Switch name="config.isServerMembersIntentEnabled" label="Enable server members intent" checked={values.config.isServerMembersIntentEnabled} onChange={handleChange} isInvalid={!!errors.config?.isServerMembersIntentEnabled} disabled={disabled} />
                                <Form.Text muted>
                                    Required for your bot to receive Guild Members events. These event are sent when a user joins or leaves a server.
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.config?.isServerMembersIntentEnabled}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group>
                                <Form.Switch name="config.isMessageContentIntentEnabled" label="Enable message content" checked={values.config.isMessageContentIntentEnabled} onChange={handleChange} isInvalid={!!errors.config?.isMessageContentIntentEnabled} disabled={disabled} />
                                <Form.Text muted>
                                    Required for your bot to receive message content in most messages. You can read more about this
                                    {' '}
                                    <a href="https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Privileged-Intent-FAQ" target="_blank" rel="noreferrer">here</a>
                                    .
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.config?.isMessageContentIntentEnabled}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Card.Body>
                        <Card.Footer>
                            Note:
                            <br />
                            These options require enabling the corresponding privileged gateway intents in the Developer Portal. Refusing to do so will make you bot not being able to connect to Discord.
                        </Card.Footer>
                    </Card>

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

DiscordConfigEditor.displayName = 'DiscordConfigEditor';

export default DiscordConfigEditor;
