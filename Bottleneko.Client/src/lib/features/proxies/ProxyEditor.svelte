<script lang="ts">
    import type { ProxyDto } from '$lib/api/dtos.gen';
    import ModalDialog from '$lib/components/ModalDialog.svelte';
    import { FormState } from '$lib/FormState.svelte';
    import { Alert, Button, Form, FormFeedback, FormGroup, FormText, Input, Label } from '@sveltestrap/sveltestrap';
    import { proxyTypes } from './provider.svelte';
    import { FormSchema, type Props, type ProxyEditorStage } from './ProxyEditor';
    import { ChangesTracker } from '$lib';

    const props: Props = $props();
    const formState = $derived(new FormState(FormSchema, props.proxy ?? undefined, props.onsuccess));
    let stage: ProxyEditorStage = $state({ id: 'select-type', type: 'Http' });

    const changesTracker = new ChangesTracker<ProxyDto | null>((_, value) => {
        if (!value) {
            stage = { id: 'select-type', type: 'Http' };
        } else {
            stage = { id: 'edit', isNew: false, proxy: value };
            formState.data = $state.snapshot(value);
        }
    }, props.proxy);
    $effect(() => {
        changesTracker.set(props.proxy);
    });
</script>

<ModalDialog
    title={stage.id === 'select-type' ? 'Proxy type' : 'Proxy settings'}
    show={props.show}
    onclose={props.onclose}
    size="lg"
>
    {#if stage.id === 'select-type'}
        {#each proxyTypes as proxyType (proxyType.type)}
            <FormGroup>
                <Input
                    type="radio"
                    label={proxyType.name}
                    value={proxyType.type}
                    bind:group={formState.data.type}
                    disabled={formState.isLoading}
                />
                <FormText>
                    {proxyType.description}
                </FormText>
            </FormGroup>
        {/each}
    {:else if stage.id === 'edit'}
        <Form
            novalidate
            onsubmit={async (e: SubmitEvent) => {
                await formState.submit(e);
            }}
            class="d-flex flex-column p-2"
            style="gap: 1rem"
        >
            {#if formState.error}
                <Alert color="danger">
                    {formState.error}
                </Alert>
            {/if}
            <FormGroup>
                <Label>Proxy name</Label>
                <Input
                    bind:value={formState.data.name}
                    invalid={!!formState.validationErrors.name}
                    autocomplete="off"
                    disabled={formState.isLoading}
                />
                <FormText>Description for the proxy</FormText>
                <FormFeedback valid={!formState.validationErrors.name}>
                    {formState.validationErrors.name}
                </FormFeedback>
            </FormGroup>

            <FormGroup>
                <Label>Hostname</Label>
                <Input
                    bind:value={formState.data.hostname}
                    invalid={!!formState.validationErrors.hostname}
                    autocomplete="off"
                    disabled={formState.isLoading}
                />
                <FormText>Hostname or IP address of the proxy</FormText>
                <FormFeedback valid={!formState.validationErrors.hostname}>
                    {formState.validationErrors.hostname}
                </FormFeedback>
            </FormGroup>

            <FormGroup>
                <Label>Port</Label>
                <Input
                    type="number"
                    bind:value={formState.data.port}
                    invalid={!!formState.validationErrors.port}
                    autocomplete="off"
                    disabled={formState.isLoading}
                />
                <FormText>Port of the proxy</FormText>
                <FormFeedback valid={!formState.validationErrors.port}>
                    {formState.validationErrors.port}
                </FormFeedback>
            </FormGroup>

            <Input
                type="checkbox"
                name="isAuthRequired"
                label="Use authentication"
                bind:checked={formState.data.isAuthRequired}
                disabled={formState.isLoading}
            />
            <FormGroup>
                <Label>Username</Label>
                <Input
                    bind:value={formState.data.username}
                    invalid={!!formState.validationErrors.username}
                    autocomplete="off"
                    disabled={!formState.data.isAuthRequired || formState.isLoading}
                />
                <FormFeedback valid={!formState.validationErrors.username}>
                    {formState.validationErrors.username}
                </FormFeedback>
            </FormGroup>

            {#if formState.data.type !== 'Socks4' && formState.data.type !== 'Socks4a'}
                <FormGroup>
                    <Label>Password</Label>
                    <Input
                        type="password"
                        bind:value={formState.data.password}
                        invalid={!!formState.validationErrors.password}
                        autocomplete="off"
                        disabled={!formState.data.isAuthRequired || formState.isLoading}
                    />
                    <FormFeedback valid={!formState.validationErrors.password}>
                        {formState.validationErrors.password}
                    </FormFeedback>
                </FormGroup>
            {/if}
        </Form>
    {/if}

    {#snippet footer()}
        {#if stage.id === 'select-type'}
            {@const next = () => {
                if (stage.id === 'select-type') {
                    stage = {
                        id: 'edit',
                        proxy: {
                            id: '',
                            name: '',
                            hostname: '',
                            port: 1080,
                            type: stage.type,
                            isAuthRequired: false,
                            username: '',
                            password: '',
                        },
                        isNew: true,
                    };
                }
            }}

            <Button onclick={props.onclose} color="secondary">Back</Button>
            <Button onclick={next} color="primary" disabled={!formState.data.type}>Next</Button>
        {:else if stage.id === 'edit'}
            {@const back = () => {
                if (stage.id === 'edit' && stage.isNew) {
                    stage = { id: 'select-type', type: stage.proxy.type };
                } else {
                    props.onclose?.();
                }
            }}

            <Button onclick={back} color="secondary">Back</Button>
            <Button onclick={() => formState.submit()} color="primary">Save</Button>
        {/if}
    {/snippet}
</ModalDialog>
