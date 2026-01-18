<script lang="ts">
    import WizardNavigation from '$lib/components/WizardNavigation.svelte';
    import { Connections } from '$lib/features/connections';
    import { onMount } from 'svelte';
    import { extractErrorInfo, type ErrorMetadata } from '$lib';
    import { Alert } from '@sveltestrap/sveltestrap';
    import Highlight from 'svelte-highlight';
    import json from 'svelte-highlight/languages/json';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import type { Props } from './AddConnectionFinish';

    const props: Props = $props();
    let error: ErrorMetadata | null = $state(null);
    let isLoading = $state(true);

    onMount(async () => {
        if (!Connections.provider) {
            await goto(resolve('/'));
            return;
        }

        try {
            const connection = await Connections.provider.add(props.definition);
            await goto(resolve('/connections/[connectionId]', { connectionId: connection.data.id }));
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
            <span class="fs-4">Adding new connection...</span>
        </Alert>
    {:else if error}
        <Alert color="danger" class="w-100">
            <p class="fs-4">Failed to add connection</p>

            <Highlight language={json} code={JSON.stringify(error, null, 2)} />
        </Alert>
    {/if}
    <WizardNavigation
        back={!isLoading && error
            ? () => {
                  props.onstagechange?.({ id: 'config', protocol: props.protocol, definition: props.definition });
              }
            : undefined}
    />
</div>
