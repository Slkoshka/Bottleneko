<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import FullscreenPage from './FullscreenPage.svelte';
    import cryingCatFace from '@netbek/noto-emoji/build/svg/u1f63f.svg';
</script>

<FullscreenPage title={{ children: 'Error' }} buttons={[{ children: 'Return', action: () => goto(resolve('/')) }]}>
    <p style:text-align="center">
        <img src={cryingCatFace} style:width="6em" style:height="6em" alt="Crying cat emoji" />
    </p>
    <p class="text-center fs-2">Page not found</p>
</FullscreenPage>
