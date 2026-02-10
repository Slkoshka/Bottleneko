<script lang="ts">
    import { TwitchScopeValues, type TwitchScope } from '$lib/api/bottleneko.gen';
    import ModalDialog from '$lib/components/ModalDialog.svelte';
    import {
        Alert,
        Button,
        Card,
        CardBody,
        CardHeader,
        Form,
        FormFeedback,
        FormGroup,
        FormText,
        Input,
        Label,
    } from '@sveltestrap/sveltestrap';
    import {
        BOTTLENEKO_CLIENT_ID,
        schema,
        type Props,
        type TwitchAuthConfig,
        type TwitchAuthStage,
        type TwitchAuthSuccess,
        type TwitchVerification,
    } from './TwitchAuthWizard';
    import { FormState } from '$lib/FormState.svelte';
    import {
        chatScopes,
        createClipsScopes,
        editChannelInfoScopes,
        editUserInfoScopes,
        moderateScopes,
        scopeNameToScope,
        scopeToScopeName,
        viewChannelInfoScopes,
        viewUserInfoScopes,
        whispersScopes,
    } from './TwitchConfigEditor';
    import LoadingBanner from '$lib/components/LoadingBanner.svelte';
    import { onDestroy } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';

    class Authorizer {
        private inProgress = false;
        private destroyed = false;
        private abort = new AbortController();
        private config: TwitchAuthConfig;
        private verification: TwitchVerification;
        private timer: ReturnType<typeof setInterval>;

        constructor(config: TwitchAuthConfig, verification: TwitchVerification) {
            this.config = config;
            this.verification = verification;
            this.timer = setInterval(() => {
                void this.onTimer();
            }, 3000);
        }

        async onTimer() {
            if (this.inProgress) {
                return;
            }

            this.inProgress = true;
            try {
                const formData = new FormData();
                formData.append(
                    'client_id',
                    this.config.clientId.trim() === '' ? BOTTLENEKO_CLIENT_ID : this.config.clientId.trim(),
                );
                formData.append('scopes', this.config.scopes.map((scope) => scopeToScopeName.get(scope)).join(' '));
                formData.append('device_code', this.verification.device_code);
                formData.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');

                const response = await fetch('https://id.twitch.tv/oauth2/token', {
                    method: 'POST',
                    body: formData,
                    signal: this.abort.signal,
                });
                const json = (await response.json()) as never;

                if (this.destroyed) {
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
                            console.error('Twitch auth failed:', result.message);
                            stage = { id: 'authorization-failed', config: this.config };
                            break;
                    }
                } else if (response.status === 200) {
                    const result = json as TwitchAuthSuccess;

                    stage = { id: 'loading-user-data', config: this.config };

                    const me = (await (
                        await fetch('https://api.twitch.tv/helix/users', {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${result.access_token}`,
                                'Client-Id':
                                    this.config.clientId.trim() === ''
                                        ? BOTTLENEKO_CLIENT_ID
                                        : this.config.clientId.trim(),
                            },
                            signal: this.abort.signal,
                        })
                    ).json()) as { data: { id: string; login: string; display_name: string }[] };

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (this.destroyed) {
                        return;
                    }

                    props.onsuccess({
                        clientId:
                            this.config.clientId.trim() === '' ? BOTTLENEKO_CLIENT_ID : this.config.clientId.trim(),
                        me: me.data[0].display_name,
                        accessToken: result.access_token,
                        refreshToken: result.refresh_token,
                        scopes: result.scope.map((scope) => scopeNameToScope[scope]),
                    });
                }
            } catch (err: unknown) {
                console.error('Twitch API request failed:', err);
                stage = { id: 'authorization-failed', config: this.config };
            } finally {
                this.inProgress = false;
            }
        }

        destroy() {
            if (this.destroyed) {
                return;
            }

            this.destroyed = true;
            clearInterval(this.timer);
            this.abort.abort();
        }
    }

    let authorizer: Authorizer | null = null;

    const { show = false, ...props }: Props = $props();
    let stage: TwitchAuthStage = $state.raw({ id: 'start' });
    const formState = $derived(
        new FormState(schema, undefined, async (data) => {
            await requestVerification(data);
        }),
    );
    let showAdvancedOptions = $state(false);

    const areScopesEnabled = (required: TwitchScope[]) => {
        return required.map((scope) => formState.data.scopes.includes(scope)).reduce((a, b) => a && b);
    };

    const enableScopes = (enable: TwitchScope[]) => {
        formState.data.scopes = [...new SvelteSet([...formState.data.scopes, ...enable])];
    };
    const disableScopes = (disable: TwitchScope[]) => {
        const set = new SvelteSet(formState.data.scopes);
        disable.forEach((scope) => set.delete(scope));
        formState.data.scopes = [...set];
    };
    const toggleScopes = (toggle: TwitchScope[]) => {
        if (areScopesEnabled(toggle)) {
            disableScopes(toggle);
        } else {
            enableScopes(toggle);
        }
    };

    const requestVerification = async (config: TwitchAuthConfig) => {
        stage = { id: 'requesting-verification', config };
        try {
            const formData = new FormData();
            formData.append('client_id', config.clientId.trim() === '' ? BOTTLENEKO_CLIENT_ID : config.clientId.trim());
            formData.append('scopes', config.scopes.map((scope) => scopeToScopeName.get(scope)).join(' '));

            const result = await fetch('https://id.twitch.tv/oauth2/device', {
                method: 'POST',
                body: formData,
            });

            const verification = (await result.json()) as TwitchVerification;
            stage = { id: 'ready-for-authorization', config, verification };
        } catch (err: unknown) {
            console.error('Twitch API request failed:', err);
            stage = { id: 'authorization-failed', config };
        }
    };

    $effect(() => {
        if (stage.id === 'ready-for-authorization') {
            authorizer?.destroy();
            authorizer = null;
            authorizer = new Authorizer(stage.config, stage.verification);
        } else if (stage.id !== 'loading-user-data') {
            authorizer?.destroy();
            authorizer = null;
        }
    });

    onDestroy(() => {
        authorizer?.destroy();
        authorizer = null;
    });

    $effect(() => {
        if (show) {
            stage = { id: 'start' };
            formState.data = formState.getDefault();
        } else {
            authorizer?.destroy();
            authorizer = null;
        }
    });
</script>

<ModalDialog title="Connect Twitch account" {show} onclose={props.onclose} size="lg">
    {#if stage.id === 'start'}
        <Form
            novalidate
            onsubmit={async (e: SubmitEvent) => {
                await formState.submit(e);
            }}
            class="d-flex flex-column p-2"
            style="gap: 1rem"
        >
            <Card>
                <CardHeader class="fw-bold">Permissions</CardHeader>
                <CardBody class="d-flex flex-column p-3" style="gap: 1rem">
                    <Input
                        type="switch"
                        label="Access to chat"
                        bind:checked={
                            () => {
                                return areScopesEnabled(chatScopes);
                            },
                            () => {
                                toggleScopes(chatScopes);
                            }
                        }
                    />

                    <Input
                        type="switch"
                        label="Access to whispers (direct messages)"
                        bind:checked={
                            () => {
                                return areScopesEnabled(whispersScopes);
                            },
                            () => {
                                toggleScopes(whispersScopes);
                            }
                        }
                    />

                    <Input
                        type="switch"
                        label="View user information"
                        bind:checked={
                            () => {
                                return areScopesEnabled(viewUserInfoScopes);
                            },
                            () => {
                                toggleScopes(viewUserInfoScopes);
                            }
                        }
                    />

                    <Input
                        type="switch"
                        label="Edit user information"
                        bind:checked={
                            () => {
                                return areScopesEnabled(editUserInfoScopes);
                            },
                            () => {
                                toggleScopes(editUserInfoScopes);
                            }
                        }
                    />

                    <Input
                        type="switch"
                        label="View channel information"
                        bind:checked={
                            () => {
                                return areScopesEnabled(viewChannelInfoScopes);
                            },
                            () => {
                                toggleScopes(viewChannelInfoScopes);
                            }
                        }
                    />

                    <Input
                        type="switch"
                        label="Edit channel information"
                        bind:checked={
                            () => {
                                return areScopesEnabled(editChannelInfoScopes);
                            },
                            () => {
                                toggleScopes(editChannelInfoScopes);
                            }
                        }
                    />

                    <Input
                        type="switch"
                        label="Moderate chat"
                        bind:checked={
                            () => {
                                return areScopesEnabled(moderateScopes);
                            },
                            () => {
                                toggleScopes(moderateScopes);
                            }
                        }
                    />

                    <Input
                        type="switch"
                        label="Create clips"
                        bind:checked={
                            () => {
                                return areScopesEnabled(createClipsScopes);
                            },
                            () => {
                                toggleScopes(createClipsScopes);
                            }
                        }
                    />
                </CardBody>
            </Card>

            <Input type="switch" label="Show advanced options" bind:checked={showAdvancedOptions} />

            {#if showAdvancedOptions}
                <FormGroup>
                    <Label>Client ID</Label>
                    <Input
                        bind:value={formState.data.clientId}
                        invalid={!!formState.validationErrors.clientId}
                        autocomplete="off"
                    />
                    <FormText>
                        Client ID is a unique application identifier provided by Twitch. You can request your own Client
                        ID by registering your bot in the <a
                            href="https://dev.twitch.tv/console/apps/create"
                            target="_blank"
                            rel="noreferrer">Twitch Developer Portal</a
                        > or leave empty to use the one provided by Bottleneko. If you are using your own Client ID, please
                        make sure that the Client Type option is set to Public in the Developer Portal.
                    </FormText>
                    <FormFeedback valid={!formState.validationErrors.clientId}>
                        {formState.validationErrors.clientId}
                    </FormFeedback>
                </FormGroup>

                <Card>
                    <CardHeader class="fw-bold">Customize API scopes</CardHeader>
                    <CardBody class="d-flex flex-column p-3" style="gap: 1rem">
                        {#each TwitchScopeValues as scope (scope)}
                            <Input
                                type="switch"
                                label={scopeToScopeName.get(scope)}
                                bind:checked={
                                    () => {
                                        return areScopesEnabled([scope]);
                                    },
                                    () => {
                                        toggleScopes([scope]);
                                    }
                                }
                            />
                            <a href="https://dev.twitch.tv/docs/authentication/scopes/" target="_blank" rel="noreferrer"
                                >Documentation</a
                            >
                        {/each}
                    </CardBody>
                </Card>
            {/if}
        </Form>
    {:else if stage.id === 'requesting-verification'}
        <LoadingBanner />
    {:else if stage.id === 'ready-for-authorization'}
        <div class="d-flex justify-content-center pb-3">
            <Button
                size="lg"
                color="primary"
                href={stage.verification.verification_uri}
                target="_blank"
                rel="noreferrer">Authorize Bottleneko</Button
            >
        </div>

        <Card>
            <CardHeader>Activation Code</CardHeader>
            <CardBody>
                <Form>
                    <div class="d-flex justify-content-center">
                        <Input
                            style="max-width: 15rem; font-size: 2rem; font-weight: bold; text-align: center"
                            type="text"
                            readonly
                            defaultValue={stage.verification.user_code}
                        />
                    </div>

                    <FormText>
                        The &apos;Authorize Bottleneko&apos; button will open the Twitch device activation page in a new
                        tab. Please make sure that the activation code matches the one shown above. Once you have
                        successfully authorized Bottleneko, this form will close automatically.
                    </FormText>
                </Form>
            </CardBody>
        </Card>
    {:else if stage.id === 'loading-user-data'}
        <LoadingBanner />
    {:else if stage.id === 'authorization-failed'}
        <Alert color="danger">
            <p class="fs-4">Authorization failed</p>

            Twitch returned an error. Please try again later.
        </Alert>
    {/if}

    {#snippet footer()}
        {#if stage.id === 'start'}
            <Button onclick={props.onclose} color="secondary">Back</Button>
            <Button
                onclick={() => {
                    void formState.submit();
                }}
                color="primary">Next</Button
            >
        {:else if stage.id === 'requesting-verification'}
            <Button disabled color="secondary">Back</Button>
            <Button disabled color="primary">Next</Button>
        {:else if stage.id === 'ready-for-authorization'}
            <Button
                onclick={() => {
                    stage = { id: 'start', config: stage.config };
                }}
                color="secondary">Back</Button
            >
            <Button disabled color="primary">Next</Button>
        {:else if stage.id === 'loading-user-data'}
            <Button disabled color="secondary">Back</Button>
            <Button disabled color="primary">Next</Button>
        {:else if stage.id === 'authorization-failed'}
            <Button
                onclick={() => {
                    stage = { id: 'start', config: stage.config };
                }}
                color="secondary">Back</Button
            >
            <Button disabled color="primary">Next</Button>
        {/if}
    {/snippet}
</ModalDialog>
