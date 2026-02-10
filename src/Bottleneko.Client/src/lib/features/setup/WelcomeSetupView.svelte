<script lang="ts">
    import type { SetupPageViewProps } from '$lib/pages/SetupPage';
    import { brand } from '$lib/props';

    const props: SetupPageViewProps = $props();

    export const submit = () => {
        props.onstagechange({ id: 'account' });
    };
</script>

<p>
    It seems like you haven&apos;t configured <strong>{brand.plain}</strong> yet. This wizard will guide you through the initial
    setup process.
</p>
<p>Don&apos;t worry; it won&apos;t take too long!</p>
