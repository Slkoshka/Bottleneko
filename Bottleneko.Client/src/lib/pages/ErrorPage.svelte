<script lang="ts">
    import { brand } from '$lib/props';
    import FullscreenPage from './FullscreenPage.svelte';
</script>

<FullscreenPage
    title={{ children: `Internal ${brand.plain} error`, variant: 'danger' }}
    buttons={[
        {
            children: 'Refresh',
            action: () => {
                window.location.reload();
            },
        },
    ]}
>
    <h5 class="my-5" style:text-align="center">A critical error has occured while accessing this page.</h5>
</FullscreenPage>
