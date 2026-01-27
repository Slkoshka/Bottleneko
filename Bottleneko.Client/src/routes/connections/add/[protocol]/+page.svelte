<script lang="ts">
    import { Connections, protocols } from '$lib/features/connections';
    import View from '$lib/components/View.svelte';
    import { type AddConnectionStage } from '.';
    import AddConnectionConfig from './AddConnectionConfig.svelte';
    import AddConnectionTest from './AddConnectionTest.svelte';
    import { page } from '$app/state';
    import { type Protocol } from '$lib/api/bottleneko.gen';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import AddConnectionFinish from './AddConnectionFinish.svelte';

    const protocol = $derived(page.params.protocol ?? '');
    let stage: AddConnectionStage | null = $state.raw(null);

    $effect(() => {
        if (!(protocol in protocols)) {
            void goto(resolve('/connections/add'));
        } else {
            stage = { id: 'config', protocol: protocol as Protocol, definition: null };
        }
    });

    const title = $derived.by(() => {
        switch (stage?.id) {
            case 'config':
                return `Connect to ${protocols[stage.protocol].name}`;

            default:
                return stage?.definition.name;
        }
    });

    const changeStage = (nextStage: AddConnectionStage) => {
        stage = nextStage;
    };
</script>

<View {title} loading={Connections.provider?.list === null} fill-screen>
    {#if stage && protocol in protocols}
        {#if stage.id === 'config'}
            <AddConnectionConfig
                protocol={protocol as Protocol}
                definition={stage.definition}
                onstagechange={changeStage}
            />
        {:else if stage.id === 'test'}
            <AddConnectionTest
                protocol={protocol as Protocol}
                definition={stage.definition}
                onstagechange={changeStage}
            />
        {:else if stage.id === 'finish'}
            <AddConnectionFinish
                protocol={protocol as Protocol}
                definition={stage.definition}
                onstagechange={changeStage}
            />
        {/if}
    {/if}
</View>
