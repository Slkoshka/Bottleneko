<script lang="ts">
    import { Button, Tooltip } from '@sveltestrap/sveltestrap';
    import ProtocolIcon from '../connections/ProtocolIcon.svelte';
    import { Connections } from '../connections';
    import { Scripts } from '../scripts';
    import type { Props } from './LogSourceDisplay';

    const props: Props = $props();

    let button: HTMLElement | undefined = $state();
</script>

{#if props.sourceType === 'System'}
    <Button class="px-1 py-0" color="primary" size="sm">System</Button>
{:else if props.sourceType === 'Connection'}
    {@const connection = Connections.provider?.list?.find((connection) => connection.data.id === props.sourceId)}
    {#if connection}
        <Button href={`/connections/${props.sourceId}`} color="success" size="sm" class="px-1 py-0">
            <ProtocolIcon protocol={connection.data.protocol} />
            {connection.data.name}
        </Button>
    {:else}
        <div bind:this={button}>
            <Button color="success" size="sm" class="px-1 py-0" disabled>
                Connection #{props.sourceId}
            </Button>
        </div>

        <Tooltip target={button} theme="light" placement="bottom">
            The connection does not exist or has been deleted.
        </Tooltip>
    {/if}
{:else if props.sourceType === 'Script'}
    {@const script = Scripts.provider?.list?.find((script) => script.data.id === props.sourceId)}
    {#if script}
        <Button href={`/scripts/${props.sourceId}`} color="warning" size="sm" class="px-1 py-0">
            {script.data.name}
        </Button>
    {:else}
        <div bind:this={button}>
            <Button color="warning" size="sm" class="px-1 py-0" disabled>
                Script #{props.sourceId}
            </Button>
        </div>

        <Tooltip target={button} theme="light" placement="bottom">
            The script does not exist or has been deleted.
        </Tooltip>
    {/if}
{/if}
