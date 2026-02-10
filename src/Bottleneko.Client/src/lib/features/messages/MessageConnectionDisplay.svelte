<script lang="ts">
    import { Button, Tooltip } from '@sveltestrap/sveltestrap';

    import { Connections } from '../connections';
    import ProtocolIcon from '../connections/ProtocolIcon.svelte';
    import { resolve } from '$app/paths';
    import type { Props } from './MessageConnectionDisplay';

    const { variant = 'primary', ...props }: Props = $props();

    const connection = $derived(
        Connections.provider?.list?.find((connection) => props.connectionId === connection.data.id),
    );
    let button: HTMLElement | undefined = $state();
</script>

{#if connection}
    <Button
        href={resolve('/connections/[connectionId]', { connectionId: connection.data.id })}
        size="sm"
        color={variant}
        class="px-1 py-0 text-collapse"
        style={props.style}
    >
        <div bind:this={button}>
            <ProtocolIcon protocol={connection.data.protocol} />
            {connection.data.name}
        </div>
    </Button>

    <Tooltip target={button} theme="light" placement="bottom" delay="250">
        {connection.data.name}
    </Tooltip>
{:else}
    <Button color="primary" size="sm" style={props.style} class="px-1 py-0 text-collapse" disabled>
        <div bind:this={button}>
            Connection #{props.connectionId ?? '?'}
        </div>
    </Button>

    <Tooltip target={button} theme="light" placement="bottom" delay="250">
        The connection does not exist or has been deleted.
    </Tooltip>
{/if}
