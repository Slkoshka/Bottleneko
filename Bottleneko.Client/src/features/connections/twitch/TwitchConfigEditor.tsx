import { Alert, Button, Card, Form, InputGroup } from 'react-bootstrap';
import { Formik } from 'formik';
import { forwardRef, useState } from 'react';
import * as yup from 'yup';
import { ConnectionDefinition } from '..';
import { TwitchProtocolChannel } from '../../api/dtos.gen';
import IconButton from '../../../components/IconButton';
import { useProxies } from '../../proxies/context';
import TwitchChannelEditor from './TwitchChannelEditor';
import TwitchAuthWizard from './TwitchAuthWizard';
import { scopeToScopeName } from './scopes';
import { topicsInfo } from './topics';
import { TwitchConfigSchema, TwitchProtocolChannelSchema } from '.';

const MAX_SUBS = 300;
const MAX_COST = 10;

const countSubs = (channels: TwitchProtocolChannel[]) => channels.reduce((prev, cur) => prev + cur.eventSubscriptions.length, 0);
const countCost = (me: string, channels: TwitchProtocolChannel[]) => channels.reduce((prev, cur) => prev + (cur.name.toLowerCase() === me.toLowerCase() ? 0 : cur.eventSubscriptions.map(s => topicsInfo.get(s)?.cost ?? 0).reduce((prev, cur) => prev + cur)), 0);

const schema = yup.object().shape({
    name: yup.string().default('').required('Name should not be empty'),
    config: TwitchConfigSchema.required(),
});

const defaultDefinition = schema.getDefault();
type TwitchConnectionDefinition = yup.InferType<typeof schema>;

const TwitchConfigEditor = forwardRef(({ definition, onValidated, disabled = false }: { definition: ConnectionDefinition | null; disabled?: boolean; onValidated: (definition: ConnectionDefinition) => void }, ref: React.ForwardedRef<HTMLFormElement>) => {
    const proxies = useProxies();
    const [isAuthShown, setIsAuthShown] = useState(false);
    const [editedChannel, setEditedChannel] = useState<TwitchProtocolChannel | null>(null);

    return (
        <>

            <Formik validationSchema={schema} onSubmit={onValidated} initialValues={definition as (TwitchConnectionDefinition | null) ?? defaultDefinition} validateOnChange={false}>
                {({ handleSubmit, handleChange, setFieldValue, values, errors }) => (
                    <>
                        <TwitchAuthWizard
                            show={isAuthShown}
                            onSuccess={(auth) => {
                                const oldChannel = values.config.auth.me;
                                void setFieldValue('config.auth', auth);
                                if (oldChannel !== auth.me) {
                                    void setFieldValue('config.channels', [{ ...TwitchProtocolChannelSchema.getDefault(), name: auth.me }]);
                                }
                                setIsAuthShown(false);
                            }}
                            onCancel={() => { setIsAuthShown(false); }}
                        />

                        <TwitchChannelEditor
                            show={!!editedChannel}
                            channel={editedChannel ?? undefined}
                            isMine={editedChannel?.name.toLowerCase() === values.config.auth.me.toLowerCase()}
                            onSuccess={(newChannel) => {
                                const newChannels: (TwitchProtocolChannel | null)[] = [...values.config.channels];
                                let found = false;
                                for (let i = 0; i < newChannels.length; i++) {
                                    if (newChannels[i]?.name === newChannel.name) {
                                        newChannels[i] = null;
                                    }

                                    if (newChannels[i]?.name === editedChannel?.name) {
                                        newChannels[i] = newChannel;
                                        found = true;
                                    }
                                }
                                if (!found) {
                                    newChannels.push(newChannel);
                                }
                                void setFieldValue('config.channels', newChannels.filter(channel => !!channel));
                                setEditedChannel(null);
                            }}
                            onCancel={() => { setEditedChannel(null); }}
                        />

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

                            <div className="d-flex flex-column align-items-center" style={{ gap: '1rem' }}>
                                <Button size="lg" onClick={() => { setIsAuthShown(true); }} variant="primary" style={{ width: 'calc(min(100%, 40rem))' }}>
                                    Connect Twitch account
                                </Button>

                                <Alert variant={values.config.auth.me ? 'success' : 'warning'} style={{ width: 'calc(min(100%, 40rem))' }}>
                                    <p className="fs-4 text-center my-0">
                                        {
                                            values.config.auth.me
                                                ? (
                                                        <>
                                                            Logged in as
                                                            {' '}
                                                            <strong>{values.config.auth.me}</strong>
                                                        </>
                                                    )
                                                : 'Not logged in'
                                        }
                                    </p>
                                </Alert>
                            </div>

                            {
                                values.config.auth.me
                                    ? (
                                            <Card>
                                                <Card.Header>Granted API scopes</Card.Header>
                                                <Card.Body>
                                                    <span className="font-monospace">{values.config.auth.scopes.map(scope => scopeToScopeName.get(scope)).join(', ')}</span>
                                                </Card.Body>
                                                <Card.Footer><a href="https://dev.twitch.tv/docs/authentication/scopes/" target="_blank" rel="noreferrer">Documentation</a></Card.Footer>
                                            </Card>
                                        )
                                    : <></>
                            }

                            <Form.Group>
                                <Form.Switch name="config.receiveEvents" label="Receive channel events" checked={values.config.receiveEvents} onChange={handleChange} isInvalid={!!errors.config?.receiveEvents} disabled={disabled || !values.config.auth.me} />
                                <Form.Text muted>
                                    If this option is enabled, in addition to allowing the bot to access the Twitch API, it will also keep an active connection to Twitch and receive new channel events.
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.config?.receiveEvents}
                                </Form.Control.Feedback>
                            </Form.Group>

                            {
                                values.config.receiveEvents && values.config.auth.me
                                    ? (
                                            <>
                                                <Form.Group>
                                                    <Form.Label>Channels</Form.Label>
                                                    <div>
                                                        {
                                                            values.config.channels.map((channel, idx) => (
                                                                <InputGroup key={`channel-${idx.toString()}`} className="float-start me-2 mb-2" style={{ width: '15rem' }}>
                                                                    <Form.Control
                                                                        name={`channel-${idx.toString()}`}
                                                                        value={channel.name}
                                                                        readOnly={true}
                                                                    />
                                                                    <IconButton
                                                                        icon="gear-fill"
                                                                        tooltip="Edit properties"
                                                                        style={{ width: '2.5em', height: '2.5em', padding: '0.5em' }}
                                                                        variant="outline-success"
                                                                        onClick={() => { setEditedChannel(channel); }}
                                                                        disabled={disabled || !values.config.auth.me}
                                                                    />
                                                                    <IconButton
                                                                        icon="trash3-fill"
                                                                        tooltip="Delete channel"
                                                                        style={{ width: '2.5em', height: '2.5em', padding: '0.5em' }}
                                                                        variant="outline-danger"
                                                                        onClick={() => {
                                                                            const channels = [...values.config.channels];
                                                                            channels.splice(idx, 1);
                                                                            void setFieldValue('config.channels', channels);
                                                                        }}
                                                                        disabled={disabled || !values.config.auth.me || values.config.auth.me.toLowerCase() === channel.name.toLowerCase()}
                                                                    />
                                                                </InputGroup>
                                                            ))
                                                        }

                                                        <IconButton
                                                            icon="plus-lg"
                                                            tooltip="Add channel"
                                                            style={{ height: '2.5em' }}
                                                            variant="primary"
                                                            onClick={() => { setEditedChannel(TwitchProtocolChannelSchema.getDefault()); }}
                                                            disabled={disabled || !values.config.auth.me || values.config.channels.length >= 100}
                                                        >
                                                        </IconButton>
                                                    </div>
                                                </Form.Group>

                                                <Alert variant={countSubs(values.config.channels) <= MAX_SUBS && countCost(values.config.auth.me, values.config.channels) <= MAX_COST ? 'success' : 'danger'}>
                                                    <p className="fs-4 mb-2">
                                                        Limits
                                                    </p>
                                                    Twitch has strict limits on the amount of events bots can subscribe to at once. The current known limits are:
                                                    <br />
                                                    <strong>
                                                        {countSubs(values.config.channels)}
                                                        {' '}
                                                        /
                                                        {' '}
                                                        {MAX_SUBS}
                                                    </strong>
                                                    {' '}
                                                    total subscriptions
                                                    <br />
                                                    <strong>
                                                        {countCost(values.config.auth.me, values.config.channels)}
                                                        {' '}
                                                        /
                                                        {' '}
                                                        {MAX_COST}
                                                    </strong>
                                                    {' '}
                                                    total cost
                                                    <p className="mt-2 mb-0">
                                                        These limits are subject to change and are partially undocumented. Subscribing to a large number topics can also negatively affect startup times, so it is recommended to only subscribe to topics that are absolutely necessary.
                                                    </p>
                                                </Alert>
                                            </>
                                        )
                                    : <></>
                            }

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
                    </>
                )}
            </Formik>
        </>
    );
});

TwitchConfigEditor.displayName = 'TwitchConfigEditor';

export default TwitchConfigEditor;
