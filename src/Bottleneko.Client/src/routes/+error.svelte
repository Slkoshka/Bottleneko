<script lang="ts">
    import { page } from '$app/state';
    import ErrorPage from '../lib/pages/ErrorPage.svelte';
    import NotFoundPage from '$lib/pages/NotFoundPage.svelte';
</script>

{#if page.status === 404}
    <NotFoundPage />
{:else}
    <ErrorPage />
{/if}
