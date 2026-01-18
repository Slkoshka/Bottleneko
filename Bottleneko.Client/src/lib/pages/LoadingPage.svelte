<script lang="ts">
    import LoadingBanner from '$lib/components/LoadingBanner.svelte';
    import { brand } from '$lib/props';
    import FullscreenPage from './FullscreenPage.svelte';
</script>

<FullscreenPage title={{ children: `Connecting to ${brand.plain}...` }}>
    <LoadingBanner size="lg" />
</FullscreenPage>
