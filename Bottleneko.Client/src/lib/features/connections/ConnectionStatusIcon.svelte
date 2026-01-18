<script lang="ts">
    import { Timer } from '$lib';
    import { type ConnectionStatus, type ExtendedConnectionStatus } from '$lib/api/dtos.gen';
    import { Tooltip } from '@sveltestrap/sveltestrap';
    import type { Snippet } from 'svelte';
    import type { Props } from './ConnectionStatusIcon';

    interface StatusIconParameters {
        color: string;
        displayName: Snippet<[ExtendedConnectionStatus]> | string;
    }

    const parameters: Record<
        ConnectionStatus,
        StatusIconParameters | ((status: ExtendedConnectionStatus) => StatusIconParameters)
    > = {
        ['NotConnected']: { color: '#aaa', displayName: 'Not Running' },
        ['Connecting']: { color: '#fb0', displayName: 'Connecting...' },
        ['Connected']: { color: '#0c0', displayName: 'Connected' },
        ['Reconnecting']: { color: '#fb0', displayName: 'Reconnecting...' },
        ['DelayedReconnect']: (status: ExtendedConnectionStatus) => ({
            color: '#fb0',
            displayName: status.statusChangeDelay <= 0 ? 'Reconnecting...' : renderDelayedReconnect,
        }),
        ['Stopping']: { color: '#fb0', displayName: 'Stopping...' },
        ['Error']: { color: '#f30', displayName: 'Error' },
    };

    const getParameters = (status: ExtendedConnectionStatus) => {
        const params = parameters[status.status];
        if (typeof params === 'function') {
            return params(status);
        } else {
            return params;
        }
    };

    const props: Props = $props();
    let currentStatus = $derived(props.status);
    let params = $derived(getParameters(props.status));
    let iconElement: HTMLElement | null = $state(null);

    new Timer(
        () => {
            params = getParameters(
                (currentStatus = { ...currentStatus, statusChangeDelay: currentStatus.statusChangeDelay - 0.5 }),
            );
        },
        500,
        true,
    );
</script>

{#snippet renderDelayedReconnect(status: ExtendedConnectionStatus)}
    Reconnecting in {Math.ceil(Math.max(0, status.statusChangeDelay))}&nbsp;second{Math.ceil(
        status.statusChangeDelay,
    ) !== 1
        ? 's'
        : ''}...
{/snippet}

{#if props['show-label']}
    <span>
        <span
            class="status-icon"
            style:width={props.size ?? '1em'}
            style:height={props.size ?? '1em'}
            style:background-color={params.color}
        ></span> <span>{params.displayName}</span>
    </span>
{:else}
    <span
        class="status-icon"
        style:width={props.size ?? '1em'}
        style:height={props.size ?? '1em'}
        style:background-color={params.color}
        bind:this={iconElement}
    ></span>
    <Tooltip target={iconElement} theme="light" placement="bottom">
        {params.displayName}
    </Tooltip>
{/if}
