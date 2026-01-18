<script lang="ts">
    import {
        Card,
        CardBody,
        CardFooter,
        CardHeader,
        Form,
        FormFeedback,
        FormGroup,
        FormText,
        Input,
        Label,
    } from '@sveltestrap/sveltestrap';
    import type { Props, ConnectionDefinition } from '..';
    import { FormState } from '$lib/FormState.svelte';
    import { Proxies } from '$lib/features/proxies';
    import type { DiscordProtocolConfiguration } from '$lib/api/dtos.gen';
    import { FormSchema } from './DiscordConfigEditor';

    const { disabled = false, ...props }: Props = $props();
    const formState = new FormState(
        FormSchema,
        props.definition?.config.$type === 'Discord'
            ? ($state.snapshot(props.definition) as ConnectionDefinition<DiscordProtocolConfiguration>)
            : undefined,
        async (data) => {
            await props.onsubmit?.($state.snapshot(data));
        },
    );
    export const submit = () => formState.submit();
</script>

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
            {disabled}
            autocomplete="off"
        />
        <FormText>
            Name is an identifier for the connection. It can be anything as long as it is informative for you.
        </FormText>
        <FormFeedback valid={!formState.validationErrors.name}>
            {formState.validationErrors.name}
        </FormFeedback>
    </FormGroup>

    <FormGroup style="margin-bottom: 0">
        <Label>Bot Token</Label>
        <Input
            type="password"
            bind:value={formState.data.config.token}
            invalid={!!formState.validationErrors['config.token']}
            {disabled}
            autocomplete="off"
        />
        <FormText>
            Discord Bot token can be obtained from the <a
                href="https://discord.com/developers/applications"
                target="_blank"
                rel="noreferrer">Discord Developer Portal</a
            >. You can read more about registering a new application
            <a
                href="https://discord.com/developers/docs/quick-start/getting-started#step-1-creating-an-app"
                target="_blank"
                rel="noreferrer">here</a
            >.
        </FormText>
        <FormFeedback valid={!formState.validationErrors['config.token']}>
            {formState.validationErrors['config.token']}
        </FormFeedback>
    </FormGroup>

    <FormGroup>
        <Input
            type="switch"
            label="Receive updates"
            bind:checked={formState.data.config.receiveEvents}
            invalid={!!formState.validationErrors['config.receiveEvents']}
            {disabled}
        />
        <FormText>
            If this option is enabled, in addition to allowing the bot to access the Discord API, it will also keep an
            active WebSocket connection and receive new events from Discord (e.g., messages and commands).
        </FormText>
        <FormFeedback valid={!formState.validationErrors['config.receiveEvents']}>
            {formState.validationErrors['config.receiveEvents']}
        </FormFeedback>
    </FormGroup>

    <Card>
        <CardHeader class="fw-bold">Privileged gateway intents</CardHeader>
        <CardBody class="d-flex flex-column p-3" style="gap: 1rem">
            <FormGroup>
                <Input
                    type="switch"
                    name="config.isPresenceIntentEnabled"
                    label="Enable presence intent"
                    bind:checked={formState.data.config.isPresenceIntentEnabled}
                    invalid={!!formState.validationErrors['config.isPresenceIntentEnabled']}
                    disabled={disabled || !formState.data.config.receiveEvents}
                />
                <FormText>
                    Required for your bot to receive Presence Update events. A user&apos;s presence is their current
                    state on a server. This event is sent when a user&apos;s presence or info, such as name or avatar,
                    is updated.
                </FormText>
                <FormFeedback valid={!formState.validationErrors['config.isPresenceIntentEnabled']}>
                    {formState.validationErrors['config.isPresenceIntentEnabled']}
                </FormFeedback>
            </FormGroup>

            <FormGroup>
                <Input
                    type="switch"
                    name="config.isServerMembersIntentEnabled"
                    label="Enable server members intent"
                    bind:checked={formState.data.config.isServerMembersIntentEnabled}
                    invalid={!!formState.validationErrors['config.isServerMembersIntentEnabled']}
                    disabled={disabled || !formState.data.config.receiveEvents}
                />
                <FormText>
                    Required for your bot to receive Guild Members events. These event are sent when a user joins or
                    leaves a server.
                </FormText>
                <FormFeedback valid={!formState.validationErrors['config.isServerMembersIntentEnabled']}>
                    {formState.validationErrors['config.isServerMembersIntentEnabled']}
                </FormFeedback>
            </FormGroup>

            <FormGroup>
                <Input
                    type="switch"
                    name="config.isMessageContentIntentEnabled"
                    label="Enable message content"
                    bind:checked={formState.data.config.isMessageContentIntentEnabled}
                    invalid={!!formState.validationErrors['config.isMessageContentIntentEnabled']}
                    disabled={disabled || !formState.data.config.receiveEvents}
                />
                <FormText>
                    Required for your bot to receive message content in most messages. You can read more about this <a
                        href="https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Privileged-Intent-FAQ"
                        target="_blank"
                        rel="noreferrer">here</a
                    >.
                </FormText>
                <FormFeedback valid={!formState.validationErrors['config.isMessageContentIntentEnabled']}>
                    {formState.validationErrors['config.isMessageContentIntentEnabled']}
                </FormFeedback>
            </FormGroup>
        </CardBody>
        <CardFooter>
            Note:
            <br />
            These options require enabling the corresponding privileged gateway intents in the Developer Portal. Refusing
            to do so will make you bot not being able to connect to Discord.
        </CardFooter>
    </Card>

    <FormGroup>
        <Label>Proxy</Label>
        <Input
            type="select"
            name="config.proxyId"
            bind:value={formState.data.config.proxyId}
            invalid={!!formState.validationErrors['config.proxyId']}
            {disabled}
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
