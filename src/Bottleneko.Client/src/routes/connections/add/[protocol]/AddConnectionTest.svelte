<script lang="ts">
    import WizardNavigation from '$lib/components/WizardNavigation.svelte';
    import { Connections } from '$lib/features/connections';
    import { getAbortSignal, onMount } from 'svelte';
    import { extractErrorInfo, type ErrorMetadata } from '$lib';
    import { Alert } from '@sveltestrap/sveltestrap';
    import Highlight from 'svelte-highlight';
    import json from 'svelte-highlight/languages/json';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import type { Props } from './AddConnectionTest';

    const props: Props = $props();
    let extra: object | null = $state(null);
    let error: ErrorMetadata | null = $state(null);
    let isLoading = $state(true);

    onMount(async () => {
        if (!Connections.provider) {
            await goto(resolve('/'));
            return;
        }

        try {
            extra = await Connections.provider.test(props.definition.config, { signal: getAbortSignal() });
        } catch (err: unknown) {
            error = extractErrorInfo(err);
        } finally {
            isLoading = false;
        }
    });
</script>

<div>
    {#if isLoading}
        <Alert color="primary" class="w-100">
            <span class="fs-4">Testing configuration...</span>
        </Alert>
    {:else if error}
        <Alert color="danger" class="w-100">
            <p class="fs-4">Configuration test failed</p>

            <Highlight language={json} code={JSON.stringify(error, null, 2)} />
        </Alert>
    {:else}
        <Alert color="success" class="w-100">
            <span class="fs-4">Success! The configuration appears to be valid.</span>
            {#if extra}
                <p>Here&apos;s some additional information that might be helpful to you:</p>
                <Highlight language={json} code={JSON.stringify(extra, null, 2)} />
            {/if}
        </Alert>
    {/if}
    <WizardNavigation
        back={() => {
            props.onstagechange?.({ id: 'config', protocol: props.protocol, definition: props.definition });
        }}
        next={!isLoading && !error
            ? () => {
                  props.onstagechange?.({ id: 'finish', protocol: props.protocol, definition: props.definition });
              }
            : undefined}
    />
</div>
