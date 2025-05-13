import { useCallback, useEffect, useRef, useState } from 'react';
import * as yup from 'yup';
import { Formik } from 'formik';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import ModalDialog from '../../../components/ModalDialog';
import { useAsync, useInterval } from '../../../app/hooks';
import LoadingBanner from '../../../components/LoadingBanner';
import { TwitchScope } from '../../api/dtos.gen';
import * as scopes from './scopes';
import { TwitchAuth } from '.';

const BOTTLENEKO_CLIENT_ID = 'd7nyymm5khoc85v7urm5unjikw9gy2';

const schema = yup.object().shape({
    clientId: yup.string().default(''),
    scopes: yup.array().of(yup.mixed<TwitchScope>().oneOf(Object.values(TwitchScope)).required()).default([...scopes.chatScopes, ...scopes.viewUserInfoScopes, ...scopes.viewChannelInfoScopes]),
});

type TwitchAuthConfig = yup.InferType<typeof schema>;
const defaultConfig = schema.getDefault();

interface TwitchVerification {
    device_code: string;
    expires_in: number;
    interval: number;
    user_code: string;
    verification_uri: string;
}

interface TwitchAuthSuccess {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string[];
    token_type: string;
}

type TwitchAuthStage =
    { id: 'start'; config?: TwitchAuthConfig } |
    { id: 'requesting-verification'; config: TwitchAuthConfig } |
    { id: 'ready-for-authorization'; config: TwitchAuthConfig; verification: TwitchVerification } |
    { id: 'loading-user-data'; config: TwitchAuthConfig } |
    { id: 'authorization-failed'; config: TwitchAuthConfig };

export default function TwitchAuthWizard({ show, onSuccess, onCancel }: { show: boolean; onSuccess: (auth: TwitchAuth) => void; onCancel: () => void }) {
    const [stage, setStage] = useState<TwitchAuthStage>({ id: 'start' });
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const areScopesEnabled = (scopes: TwitchScope[], required: TwitchScope[]) => {
        return required.map(scope => scopes.includes(scope)).reduce((a, b) => a && b);
    };

    const enableScopes = (scopes: TwitchScope[], enable: TwitchScope[]) => [...new Set([...scopes, ...enable])];
    const disableScopes = (scopes: TwitchScope[], disable: TwitchScope[]) => {
        const set = new Set(scopes);
        disable.forEach(scope => set.delete(scope));
        return [...set];
    };
    const toggleScopes = (scopes: TwitchScope[], toggle: TwitchScope[]) => {
        if (areScopesEnabled(scopes, toggle)) {
            return disableScopes(scopes, toggle);
        }
        else {
            return enableScopes(scopes, toggle);
        }
    };

    const prevShown = useRef(show);
    useEffect(() => {
        if (!prevShown.current && show) {
            setStage({ id: 'start' });
        }
        prevShown.current = show;
    }, [show]);

    const currentUpdateRef = useRef<object | null>(null);
    const whichUpdateRef = useRef({});
    useInterval(useCallback(() => {
        if (currentUpdateRef.current !== null || stage.id !== 'ready-for-authorization') {
            return;
        }
        currentUpdateRef.current = whichUpdateRef.current;

        void (async () => {
            try {
                if (currentUpdateRef.current !== whichUpdateRef.current) {
                    return;
                }

                const formData = new FormData();
                formData.append('client_id', stage.config.clientId.trim() === '' ? BOTTLENEKO_CLIENT_ID : stage.config.clientId.trim());
                formData.append('scopes', stage.config.scopes.map(scope => scopes.scopeToScopeName.get(scope)).join(' '));
                formData.append('device_code', stage.verification.device_code);
                formData.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');

                const response = await fetch('https://id.twitch.tv/oauth2/token', {
                    method: 'POST',
                    body: formData,
                });
                const json = await response.json() as never;

                if (currentUpdateRef.current !== whichUpdateRef.current) {
                    return;
                }

                if (response.status === 400) {
                    const result = json as { status: number; message: string };
                    switch (result.message) {
                        case 'authorization_pending':
                            // everything is okay, keep waiting
                            break;

                        case 'invalid device code':
                        default:
                            console.error('twitch auth failed', result.message);
                            setStage({ id: 'authorization-failed', config: stage.config });
                            break;
                    }
                }
                else if (response.status === 200) {
                    const result = json as TwitchAuthSuccess;

                    setStage({ id: 'loading-user-data', config: stage.config });

                    const me = await (await fetch('https://api.twitch.tv/helix/users', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${result.access_token}`,
                            'Client-Id': stage.config.clientId.trim() === '' ? BOTTLENEKO_CLIENT_ID : stage.config.clientId.trim(),
                        },
                    })).json() as { data: { id: string; login: string; display_name: string }[] };
                    onSuccess({
                        clientId: stage.config.clientId.trim() === '' ? BOTTLENEKO_CLIENT_ID : stage.config.clientId.trim(),
                        me: me.data[0].display_name,
                        accessToken: result.access_token,
                        refreshToken: result.refresh_token,
                        scopes: result.scope.map(scope => scopes.scopeNameToScope[scope]),
                    });
                }
            }
            catch {
                setStage({ id: 'authorization-failed', config: stage.config });
            }
            finally {
                currentUpdateRef.current = null;
            }
        })();
    }, [stage, onSuccess]), 3000);

    useEffect(() => {
        return () => {
            whichUpdateRef.current = {};
        };
    }, [stage]);

    const [requestVerification] = useAsync(useCallback(async (config: TwitchAuthConfig) => {
        setStage({ id: 'requesting-verification', config });
        try {
            const formData = new FormData();
            formData.append('client_id', config.clientId.trim() === '' ? BOTTLENEKO_CLIENT_ID : config.clientId.trim());
            formData.append('scopes', config.scopes.map(scope => scopes.scopeToScopeName.get(scope)).join(' '));

            const result = await fetch('https://id.twitch.tv/oauth2/device', {
                method: 'POST',
                body: formData,
            });

            const verification = await result.json() as TwitchVerification;
            console.log(verification);
            setStage({ id: 'ready-for-authorization', config, verification });
        }
        catch (err) {
            console.error('Twitch API request failed:', err);
            setStage({ id: 'authorization-failed', config });
        }
    }, []));

    switch (stage.id) {
        case 'start':
            return (
                <ModalDialog
                    header="Connect Twitch account"
                    show={show}
                    buttons={[
                        { key: 'back', text: 'Back', onClick: onCancel, props: { variant: 'secondary' } },
                        { key: 'next', text: 'Next', onClick: () => { formRef.current?.requestSubmit(); } },
                    ]}
                    onCancel={onCancel}
                >
                    <Formik validationSchema={schema} onSubmit={requestVerification} initialValues={stage.config ?? defaultConfig} validateOnChange={false}>
                        {({ handleSubmit, handleChange, setFieldValue, values, errors }) => (
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
                                <Card>
                                    <Card.Header className="fw-bold">Permissions</Card.Header>
                                    <Card.Body className="d-flex flex-column p-3" style={{ gap: '1rem' }}>
                                        <Form.Switch
                                            label="Access to chat"
                                            checked={areScopesEnabled(values.scopes, scopes.chatScopes)}
                                            onChange={() => void setFieldValue('scopes', toggleScopes(values.scopes, scopes.chatScopes))}
                                        />

                                        <Form.Switch
                                            label="Access to whispers (direct messages)"
                                            checked={areScopesEnabled(values.scopes, scopes.whispersScopes)}
                                            onChange={() => void setFieldValue('scopes', toggleScopes(values.scopes, scopes.whispersScopes))}
                                        />

                                        <Form.Switch
                                            label="View user information"
                                            checked={areScopesEnabled(values.scopes, scopes.viewUserInfoScopes)}
                                            onChange={() => void setFieldValue('scopes', toggleScopes(values.scopes, scopes.viewUserInfoScopes))}
                                        />

                                        <Form.Switch
                                            label="Edit user information"
                                            checked={areScopesEnabled(values.scopes, scopes.editUserInfoScopes)}
                                            onChange={() => void setFieldValue('scopes', toggleScopes(values.scopes, scopes.editUserInfoScopes))}
                                        />

                                        <Form.Switch
                                            label="View channel information"
                                            checked={areScopesEnabled(values.scopes, scopes.viewChannelInfoScopes)}
                                            onChange={() => void setFieldValue('scopes', toggleScopes(values.scopes, scopes.viewChannelInfoScopes))}
                                        />

                                        <Form.Switch
                                            label="Edit channel information"
                                            checked={areScopesEnabled(values.scopes, scopes.editChannelInfoScopes)}
                                            onChange={() => void setFieldValue('scopes', toggleScopes(values.scopes, scopes.editChannelInfoScopes))}
                                        />

                                        <Form.Switch
                                            label="Moderate chat"
                                            checked={areScopesEnabled(values.scopes, scopes.moderateScopes)}
                                            onChange={() => void setFieldValue('scopes', toggleScopes(values.scopes, scopes.moderateScopes))}
                                        />

                                        <Form.Switch
                                            label="Create clips"
                                            checked={areScopesEnabled(values.scopes, scopes.createClipsScopes)}
                                            onChange={() => void setFieldValue('scopes', toggleScopes(values.scopes, scopes.createClipsScopes))}
                                        />
                                    </Card.Body>
                                </Card>

                                <Form.Switch
                                    label="Show advanced options"
                                    checked={showAdvancedOptions}
                                    onChange={() => { setShowAdvancedOptions(!showAdvancedOptions); }}
                                />

                                {
                                    showAdvancedOptions
                                        ? (
                                                <>
                                                    <Form.Group>
                                                        <Form.Label>Client ID</Form.Label>
                                                        <Form.Control name="clientId" value={values.clientId} onChange={handleChange} isInvalid={!!errors.clientId} autoComplete="off" />
                                                        <Form.Text muted>
                                                            Client ID is a unique application identifier provided by Twitch. You can request your own Client ID by registering your bot in the
                                                            {' '}
                                                            <a href="https://dev.twitch.tv/console/apps/create" target="_blank" rel="noreferrer">Twitch Developer Portal</a>
                                                            {' '}
                                                            or leave empty to use the one provided by Bottleneko. If you are using your own Client ID, please make sure that the Client Type option is set to Public in the Developer Portal.
                                                        </Form.Text>
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.clientId}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>

                                                    <Card>
                                                        <Card.Header className="fw-bold">Customize API scopes</Card.Header>
                                                        <Card.Body className="d-flex flex-column p-3" style={{ gap: '1rem' }}>
                                                            {
                                                                Object.values(TwitchScope).map(scope => (
                                                                    <Form.Switch
                                                                        key={scope}
                                                                        label={scopes.scopeToScopeName.get(scope)}
                                                                        checked={areScopesEnabled(values.scopes, [scope])}
                                                                        onChange={() => void setFieldValue('scopes', toggleScopes(values.scopes, [scope]))}
                                                                    />
                                                                ))
                                                            }
                                                            <a href="https://dev.twitch.tv/docs/authentication/scopes/" target="_blank" rel="noreferrer">Documentation</a>
                                                        </Card.Body>
                                                    </Card>
                                                </>
                                            )
                                        : <></>
                                }
                            </Form>
                        )}
                    </Formik>
                </ModalDialog>
            );

        case 'requesting-verification':
            return (
                <ModalDialog
                    header="Connect Twitch account"
                    show={show}
                    buttons={[
                        { key: 'back', text: 'Back', disabled: true, props: { variant: 'secondary' } },
                        { key: 'next', text: 'Next', disabled: true },
                    ]}
                    onCancel={onCancel}
                >
                    <LoadingBanner />
                </ModalDialog>
            );

        case 'ready-for-authorization':
            return (
                <ModalDialog
                    header="Connect Twitch account"
                    show={show}
                    buttons={[
                        { key: 'back', text: 'Back', onClick: () => { setStage({ id: 'start', config: stage.config }); }, props: { variant: 'secondary' } },
                        { key: 'next', text: 'Next', disabled: true },
                    ]}
                    onCancel={onCancel}
                >
                    <div className="d-flex justify-content-center pb-3">
                        <Button size="lg" as="a" href={stage.verification.verification_uri} target="_blank" rel="noreferrer">Authorize Bottleneko</Button>
                    </div>

                    <Card>
                        <Card.Header>Activation Code</Card.Header>
                        <Card.Body>
                            <Form>
                                <div className="d-flex justify-content-center">
                                    <Form.Control style={{ maxWidth: '15rem', fontSize: '2rem', fontWeight: 'bold', textAlign: 'center' }} type="text" readOnly={true} defaultValue={stage.verification.user_code} />
                                </div>

                                <Form.Text muted>
                                    The &apos;Authorize Bottleneko&apos; button will open the Twitch device activation page in a new tab. Please make sure that the activation code matches the one shown above. Once you have successfully authorized Bottleneko, this form will close automatically.
                                </Form.Text>
                            </Form>
                        </Card.Body>
                    </Card>
                </ModalDialog>
            );

        case 'loading-user-data':
            return (
                <ModalDialog
                    header="Connect Twitch account"
                    show={show}
                    buttons={[
                        { key: 'back', text: 'Back', disabled: true, props: { variant: 'secondary' } },
                        { key: 'next', text: 'Next', disabled: true },
                    ]}
                    onCancel={onCancel}
                >
                    <LoadingBanner />
                </ModalDialog>
            );

        case 'authorization-failed':
            return (
                <ModalDialog
                    header="Connect Twitch account"
                    show={show}
                    buttons={[
                        { key: 'back', text: 'Back', onClick: () => { setStage({ id: 'start', config: stage.config }); }, props: { variant: 'secondary' } },
                        { key: 'next', text: 'Next', disabled: true },
                    ]}
                    onCancel={onCancel}
                >
                    <Alert variant="danger">
                        <p className="fs-4">Authorization failed</p>

                        Twitch returned an error. Please try again later.
                    </Alert>
                </ModalDialog>
            );

        default:
            return <></>;
    }
}
