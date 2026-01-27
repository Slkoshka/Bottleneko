<script lang="ts">
    import { Form, FormFeedback, FormGroup, FormText, Input, Label } from '@sveltestrap/sveltestrap';
    import type { Props, ConnectionDefinition } from '..';
    import { FormState } from '$lib/FormState.svelte';
    import { Proxies } from '$lib/features/proxies';
    import type { TelegramProtocolConfiguration } from '$lib/api/bottleneko.gen';
    import { FormSchema } from './TelegramConfigEditor';

    const props: Props = $props();
    const formState = new FormState(
        FormSchema,
        props.definition?.config.$type === 'Telegram'
            ? ($state.snapshot(props.definition) as ConnectionDefinition<TelegramProtocolConfiguration>)
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

    <FormGroup style="margin-bottom: 0">
        <Label>Bot Token</Label>
        <Input
            type="password"
            bind:value={formState.data.config.token}
            invalid={!!formState.validationErrors['config.token']}
            disabled={props.disabled}
            autocomplete="off"
        />
        <FormText>
            Telegram Bot token can be obtained from <a href="https://t.me/BotFather" target="_blank" rel="noreferrer"
                >@BotFather</a
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
            disabled={props.disabled}
        />
        <FormText>
            If this option is enabled, in addition to allowing the bot to access the Telegram Bot API, it will also keep
            an active connection and receive new events from Telegram (e.g., messages and commands).
        </FormText>
        <FormFeedback valid={!formState.validationErrors['config.receiveEvents']}>
            {formState.validationErrors['config.receiveEvents']}
        </FormFeedback>
    </FormGroup>

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
