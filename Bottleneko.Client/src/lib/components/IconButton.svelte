<script lang="ts">
    import { Button, Tooltip } from '@sveltestrap/sveltestrap';
    import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg';
    import type { Props } from './IconButton';

    const props: Props = $props();
    let button: HTMLElement | null = $state(null);
    let tooltipShown = $state(false);
</script>

<Button
    id="btn"
    href={props.href}
    style={`aspect-ratio: 1; padding: 0; width: ${props.size ?? '2em'}; height: ${props.size ?? '2em'}; ${props.style ?? ''}`}
    color={props.variant}
    disabled={props.disabled ?? undefined}
    onclick={(e: MouseEvent & { currentTarget: HTMLElement }) => {
        tooltipShown = true;
        props.onclick?.(e);
    }}
>
    <div bind:this={button} class="w-100 h-100">
        <svg class="bi" style:display="inline" style="width: 70%; height: 70%; margin: 15%" fill="currentColor">
            <use xlink:href={`${bootstrapIcons}#${props.icon}`} />
        </svg>
    </div>
</Button>

{#if props.tooltip !== null}
    <Tooltip target={button} bind:isOpen={tooltipShown} theme="light" placement="bottom" delay="250">
        {#if typeof props.tooltip === 'string'}
            {props.tooltip}
        {:else}
            {@render props.tooltip()}
        {/if}
    </Tooltip>
{/if}
