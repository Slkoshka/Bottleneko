<script lang="ts">
    import { Connections } from '$lib/features/connections';
    import View from '$lib/components/View.svelte';
    import ConnectionList from '$lib/features/connections/ConnectionList.svelte';
</script>

<View title="Connections" loading={Connections.provider?.list === null} fill-screen>
    <ConnectionList />
</View>
