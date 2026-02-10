<script lang="ts">
    import type { SetupPageViewProps } from '$lib/pages/SetupPage';
    import Highlight from 'svelte-highlight';
    import json from 'svelte-highlight/languages/json';

    const props: SetupPageViewProps & { error: object } = $props();
</script>

<p>
    <Highlight language={json} code={JSON.stringify(props.error, null, 2)} />
</p>
