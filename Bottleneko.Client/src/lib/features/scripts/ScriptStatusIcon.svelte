<script lang="ts">
    import { type ScriptStatus } from '$lib/api/dtos.gen';
    import { Tooltip } from '@sveltestrap/sveltestrap';
    import type { Props } from './ScriptStatusIcon';

    interface StatusIconParameters {
        color: string;
        displayName: string;
    }

    const parameters: Record<ScriptStatus, StatusIconParameters> = {
        ['Stopped']: { color: '#aaa', displayName: 'Not Running' },
        ['Starting']: { color: '#fb0', displayName: 'Starting...' },
        ['Running']: { color: '#0c0', displayName: 'Running' },
        ['Restarting']: { color: '#fb0', displayName: 'Restarting...' },
        ['Stopping']: { color: '#fb0', displayName: 'Stopping...' },
        ['Error']: { color: '#f30', displayName: 'Error' },
    };

    const props: Props = $props();
    let params = $derived(parameters[props.status]);
    let iconElement: HTMLElement | null = $state(null);
</script>

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
