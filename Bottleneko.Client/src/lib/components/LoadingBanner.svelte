<script lang="ts">
    import { Spinner } from '@sveltestrap/sveltestrap';
    import type { Props } from './LoadingBanner';

    const { size = 'sm', ...props }: Props = $props();
</script>

<div class="container d-flex w-100 h-100 justify-content-center align-items-center flex-column" style:gap="2rem">
    <Spinner type="border" class={`loading-spinner-${size}`} />
    {#if props.description}
        <h2>{props.description}</h2>
    {/if}
</div>

<style>
    .container > :global(.loading-spinner-sm) {
        width: 1rem;
        height: 1rem;
    }
    .container > :global(.loading-spinner-lg) {
        width: 3rem;
        height: 3rem;
    }
    .container > :global(.loading-spinner-xl) {
        width: 5rem;
        height: 5rem;
    }
</style>
