<script lang="ts">
    import MouseBlocker from '$lib/components/MouseBlocker.svelte';
    import { Input, Tooltip } from '@sveltestrap/sveltestrap';
    import ScriptStatusIcon from './ScriptStatusIcon.svelte';
    import type { LocalScript } from './provider.svelte';
    import StateControlButtons from '$lib/components/StateControlButtons.svelte';
    import type { Props } from './ScriptListRowRenderer';

    const props: Props = $props();

    let descriptionElement: HTMLElement | undefined = $state();
</script>

{#if props.column === 'name'}
    {props.row.data.name}
{:else if props.column === 'description'}
    {#if props.row.data.description}
        <div class="text-collapse" bind:this={descriptionElement}>{props.row.data.description}</div>
        <Tooltip target={descriptionElement} placement="bottom" theme="light">{props.row.data.description}</Tooltip>
    {:else}
        <em class="text-secondary">(no description)</em>
    {/if}
{:else if props.column === 'status'}
    <ScriptStatusIcon status={props.row.data.status} show-label />
{:else if props.column === 'autostart'}
    <MouseBlocker>
        <Input
            type="switch"
            style="font-size: 1.25em"
            checked={props.row.data.autoStart}
            disabled={props.row.isLoading}
            onchange={() => void props.row.setAutoStart(!props.row.data.autoStart)}
        />
    </MouseBlocker>
{:else if props.column === 'actions'}
    <div class="w-100 justify-content-end">
        <MouseBlocker>
            <StateControlButtons
                entity={props.row}
                startTooltip="Start script"
                restartTooltip="Restart script"
                stopTooltip="Stop script"
                stopIcon="sign-stop"
                ondelete={(script) => {
                    props.ondelete(script as LocalScript);
                }}
                size="2em"
            />
        </MouseBlocker>
    </div>
{/if}
