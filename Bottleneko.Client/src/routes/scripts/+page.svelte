<script lang="ts">
    import { Scripts } from '$lib/features/scripts';
    import View from '$lib/components/View.svelte';
    import ScriptList from '$lib/features/scripts/ScriptList.svelte';
</script>

<View title="Scripts" loading={Scripts.provider?.list === null} fill-screen>
    <ScriptList />
</View>
