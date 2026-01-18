<script lang="ts">
    import type { SetupPageViewProps } from '$lib/pages/SetupPage';
    import { brand } from '$lib/props';
    import { initAuth } from '$lib/features/auth.svelte';

    const props: SetupPageViewProps & { 'access-token': string } = $props();

    export const submit = () => {
        void initAuth(props['access-token']);
    };
</script>

<p class="fs-4 text-center">The initial setup has been completed.</p>
<p class="fs-4 text-center">
    You&apos;re now ready to use <strong>{brand.plain}</strong>!
</p>
