<script lang="ts">
    import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg';
    import { Tooltip } from '@sveltestrap/sveltestrap';
    import type { Props } from './InlineIcon';

    const props: Props = $props();

    let iconElement: HTMLElement | null = $state(null);
</script>

<div bind:this={iconElement} style:display="inline" style:vertical-align="0.1em">
    <svg
        class="bi"
        style:display="inline"
        style:width={props.size ?? '1em'}
        style:height={props.size ?? '1em'}
        fill="currentColor"
    >
        <use xlink:href={`${bootstrapIcons}#${props.icon}`} />
    </svg>
</div>

{#if props.tooltip}
    <Tooltip target={iconElement} placement="bottom" theme="light" delay={200}>
        {#if typeof props.tooltip === 'string'}
            {props.tooltip}
        {:else}
            {@render props.tooltip()}
        {/if}
    </Tooltip>
{/if}
