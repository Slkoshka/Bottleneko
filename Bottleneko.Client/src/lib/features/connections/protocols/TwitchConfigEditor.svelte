<script lang="ts">
    import {
        Alert,
        Button,
        Card,
        CardBody,
        CardFooter,
        CardHeader,
        Form,
        FormFeedback,
        FormGroup,
        FormText,
        Input,
        InputGroup,
        Label,
    } from '@sveltestrap/sveltestrap';
    import type { Props, ConnectionDefinition } from '..';
    import { FormState } from '$lib/FormState.svelte';
    import { Proxies } from '$lib/features/proxies';
    import type { TwitchAuth, TwitchProtocolChannel, TwitchProtocolConfiguration } from '$lib/api/dtos.gen';
    import {
        countCost,
        countSubs,
        FormSchema,
        MAX_COST,
        MAX_SUBS,
        scopeToScopeName,
        TwitchProtocolChannelSchema,
    } from './TwitchConfigEditor';
    import TwitchAuthWizard from './TwitchAuthWizard.svelte';
    import IconButton from '$lib/components/IconButton.svelte';
    import TwitchChannelEditor from './TwitchChannelEditor.svelte';

    const props: Props = $props();
    const formState = new FormState(
        FormSchema,
        props.definition?.config.$type === 'Twitch'
            ? ($state.snapshot(props.definition) as ConnectionDefinition<TwitchProtocolConfiguration>)
            : undefined,
        async (data) => {
            await props.onsubmit?.($state.snapshot(data));
        },
    );

    let isAuthShown = $state(false);
    let editingChannel: TwitchProtocolChannel | null = $state(null);

    export const submit = () => formState.submit();
</script>

<TwitchAuthWizard
    show={isAuthShown}
    onsuccess={(auth: TwitchAuth) => {
        const oldChannel = formState.data.config.auth.me;
        formState.data.config.auth = auth;
        if (oldChannel !== auth.me) {
            formState.data.config.channels = [{ ...TwitchProtocolChannelSchema.getDefault(), name: auth.me }];
        }
        isAuthShown = false;
    }}
    onclose={() => {
        isAuthShown = false;
    }}
/>

<TwitchChannelEditor
    show={!!editingChannel}
    channel={editingChannel ?? undefined}
    is-mine={editingChannel?.name.toLowerCase() === formState.data.config.auth.me.toLowerCase()}
    onsuccess={(newChannel: TwitchProtocolChannel) => {
        const newChannels: (TwitchProtocolChannel | null)[] = [...formState.data.config.channels];
        let found = false;
        for (let i = 0; i < newChannels.length; i++) {
            if (newChannels[i]?.name === newChannel.name) {
                newChannels[i] = null;
            }

            if (newChannels[i]?.name === editingChannel?.name) {
                newChannels[i] = newChannel;
                found = true;
            }
        }
        if (!found) {
            newChannels.push(newChannel);
        }
        formState.data.config.channels = newChannels.filter((channel) => !!channel);
        editingChannel = null;
    }}
    onclose={() => {
        editingChannel = null;
    }}
/>

<Form
    novalidate
    onsubmit={async (e: SubmitEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await formState.submit();
    }}
    class="d-flex flex-column w-100"
    style="gap: 1rem"
>
    <FormGroup>
        <Label>Name</Label>
        <Input
            name="name"
            bind:value={formState.data.name}
            invalid={!!formState.validationErrors.name}
            disabled={props.disabled}
            autocomplete="off"
        />
        <FormText>
            Name is an identifier for the connection. It can be anything as long as it is informative for you.
        </FormText>
        <FormFeedback valid={!formState.validationErrors.name}>
            {formState.validationErrors.name}
        </FormFeedback>
    </FormGroup>

    <div class="d-flex flex-column align-items-center" style:gap="1rem">
        <Button
            size="lg"
            onclick={(e: MouseEvent) => {
                e.preventDefault();
                isAuthShown = true;
            }}
            color="primary"
            style="width: calc(min(100%, 40rem))"
        >
            Connect Twitch account
        </Button>

        <Alert
            color={formState.data.config.auth.me !== '' ? 'success' : 'warning'}
            style="width: calc(min(100%, 40rem))"
        >
            <p class="fs-4 text-center my-0">
                {#if formState.data.config.auth.me === ''}
                    Not logged in
                {:else}
                    <span>Logged in as <strong>{formState.data.config.auth.me}</strong></span>
                {/if}
            </p>
        </Alert>
    </div>

    {#if formState.data.config.auth.me !== ''}
        <Card>
            <CardHeader>Granted API scopes</CardHeader>
            <CardBody>
                <span class="font-monospace"
                    >{formState.data.config.auth.scopes.map((scope) => scopeToScopeName.get(scope)).join(', ')}</span
                >
            </CardBody>
            <CardFooter
                ><a href="https://dev.twitch.tv/docs/authentication/scopes/" target="_blank" rel="noreferrer"
                    >Documentation</a
                ></CardFooter
            >
        </Card>
    {/if}

    <FormGroup>
        <Input
            type="switch"
            label="Receive updates"
            bind:checked={formState.data.config.receiveEvents}
            invalid={!!formState.validationErrors['config.receiveEvents']}
            disabled={props.disabled === true || formState.data.config.auth.me === ''}
        />
        <FormText>
            If this option is enabled, in addition to allowing the bot to access the Twitch Bot API, it will also keep
            an active connection and receive new events from Twitch (e.g., messages and commands).
        </FormText>
        <FormFeedback valid={!formState.validationErrors['config.receiveEvents']}>
            {formState.validationErrors['config.receiveEvents']}
        </FormFeedback>
    </FormGroup>

    {#if formState.data.config.auth.me !== ''}
        <FormGroup>
            <Label>Channels</Label>
            <div>
                {#each formState.data.config.channels as channel (channel.name)}
                    <InputGroup class="float-start me-2 mb-2" style="width: 15rem">
                        <Input value={channel.name} readonly />
                        <IconButton
                            icon="gear-fill"
                            tooltip="Edit properties"
                            style="width: 2.5em; height: 2.5em; padding: 0.5em"
                            variant="outline-success"
                            onclick={(e: MouseEvent) => {
                                e.preventDefault();
                                editingChannel = channel;
                            }}
                            disabled={props.disabled === true || formState.data.config.auth.me === ''}
                        />
                        <IconButton
                            icon="trash3-fill"
                            tooltip="Delete channel"
                            style="width: 2.5em; height: 2.5em; padding: 0.5em"
                            variant="outline-danger"
                            onclick={(e: MouseEvent) => {
                                e.preventDefault();
                                formState.data.config.channels.splice(
                                    formState.data.config.channels.indexOf(channel),
                                    1,
                                );
                            }}
                            disabled={props.disabled === true ||
                                formState.data.config.auth.me === '' ||
                                formState.data.config.auth.me.toLowerCase() === channel.name.toLowerCase()}
                        />
                    </InputGroup>
                {/each}

                <IconButton
                    icon="plus-lg"
                    tooltip="Add channel"
                    style="height: 2.5em"
                    variant="primary"
                    onclick={(e: MouseEvent) => {
                        e.preventDefault();
                        editingChannel = TwitchProtocolChannelSchema.getDefault();
                    }}
                    disabled={props.disabled === true ||
                        formState.data.config.auth.me === '' ||
                        formState.data.config.channels.length >= 100}
                ></IconButton>
            </div>
        </FormGroup>

        <Alert
            color={countSubs(formState.data.config.channels) <= MAX_SUBS &&
            countCost(formState.data.config.auth.me, formState.data.config.channels) <= MAX_COST
                ? 'success'
                : 'danger'}
        >
            <p class="fs-4 mb-2">Limits</p>
            Twitch has strict limits on the amount of events bots can subscribe to at once. The current known limits are:
            <br />
            <span>
                <strong>{countSubs(formState.data.config.channels)} / {MAX_SUBS}</strong> total subscriptions
            </span>
            <br />
            <span
                ><strong>{countCost(formState.data.config.auth.me, formState.data.config.channels)} / {MAX_COST}</strong
                > total cost</span
            >
            <p class="mt-2 mb-0">
                These limits are subject to change and are partially undocumented. Subscribing to a large number topics
                can also negatively affect startup times, so it is recommended to only subscribe to topics that are
                absolutely necessary.
            </p>
        </Alert>
    {/if}

    <FormGroup>
        <Label>Proxy</Label>
        <Input
            type="select"
            name="config.proxyId"
            bind:value={formState.data.config.proxyId}
            invalid={!!formState.validationErrors['config.proxyId']}
            disabled={props.disabled}
        >
            <option value="">Don&apos;t use a proxy</option>
            {#each Proxies.provider?.list as proxy (proxy.data.id)}
                <option value={proxy.data.id}>{proxy.data.name}</option>
            {/each}
        </Input>
        <FormText>Use a proxy server for outgoing connections.</FormText>
        <FormFeedback valid={!formState.validationErrors['config.proxyId']}>
            {formState.validationErrors['config.proxyId']}
        </FormFeedback>
    </FormGroup>
</Form>
