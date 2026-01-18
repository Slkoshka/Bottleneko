<script lang="ts">
    import LoadingBanner from './LoadingBanner.svelte';
    import type { Props } from './View';

    const props: Props = $props();
</script>

<div class={['d-flex', 'flex-column', 'h-100', 'view', props['fill-screen'] === true ? 'fill-screen' : undefined]}>
    {#if typeof props.title === 'string'}
        <h1>{props.title}</h1>
        <hr />
    {:else}
        <h1>{@render props.title?.()}</h1>
        <hr />
    {/if}
    {#if props.loading}
        <LoadingBanner />
    {:else if props.variant === 'base'}
        {@render props.children?.()}
    {:else}
        <div class="content">
            {@render props.children?.()}
        </div>
    {/if}
</div>

<style lang="scss">
    .fill-screen {
        & > :global(.content),
        :global(.tab-content) {
            flex-grow: 1;
            overflow: hidden;
        }

        & > :global(.content) > :global(*) {
            height: 100%;
        }

        & > :global(.tab-content) {
            display: flex;
            flex-direction: column;

            & > :global(.tab-pane) {
                height: 100%;
            }
        }
    }
</style>
