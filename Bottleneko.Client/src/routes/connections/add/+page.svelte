<script lang="ts">
    import { Connections, protocols } from '$lib/features/connections';
    import View from '$lib/components/View.svelte';
    import { type Protocol } from '$lib/api/dtos.gen';
    import { Button } from '@sveltestrap/sveltestrap';
    import ProtocolIcon from '$lib/features/connections/ProtocolIcon.svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
</script>

<View title="Add a new connection" loading={Connections.provider?.list === null} fill-screen>
    <div class="d-flex flex-column">
        {#each Object.keys(protocols) as Protocol[] as protocol (protocol)}
            <div class="p-1 w-100" style:max-width="35em" style:min-height="5em">
                <Button
                    type="radio"
                    class="w-100 h-100 d-flex align-items-center p-4"
                    name="protocol"
                    color="primary"
                    onclick={() => goto(resolve('/connections/add/[protocol]', { protocol }))}
                >
                    <div class="mt-0">
                        <ProtocolIcon {protocol} size="3em" />
                    </div>
                    <div class="px-4 d-flex flex-column align-items-start">
                        <span class="fs-3" style:text-align="left">{protocols[protocol].name}</span>
                        {#if protocols[protocol].description}
                            <span style:text-align="left">{protocols[protocol].description}</span>
                        {/if}
                    </div>
                </Button>
            </div>
        {/each}
    </div>
</View>
