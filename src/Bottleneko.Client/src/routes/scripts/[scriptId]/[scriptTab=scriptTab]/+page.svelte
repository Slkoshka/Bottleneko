<script lang="ts">
    import { Scripts } from '$lib/features/scripts';
    import View from '$lib/components/View.svelte';
    import { page } from '$app/state';
    import { resolve } from '$app/paths';
    import { Alert } from '@sveltestrap/sveltestrap';
    import TabView from '$lib/components/TabView.svelte';
    import StateControlButtons from '$lib/components/StateControlButtons.svelte';
    import EntityDeletionDialog from '$lib/components/EntityDeletionDialog.svelte';
    import { goto } from '$app/navigation';
    import Tab from '$lib/components/Tab.svelte';
    import LogViewer from '$lib/features/log/LogViewer.svelte';
    import ScriptEditor from '$lib/features/scripts/ScriptEditor.svelte';
    import type { EditedScript } from '$lib/features/scripts/ScriptEditor';

    const script = $derived(Scripts.provider?.list?.find((script) => script.data.id === page.params.scriptId) ?? null);
    let isDeleting = $state(false);

    const isLoading = $derived(Scripts.provider?.list === null || isDeleting);
    let isShowingDeletionDialog = $state(false);

    let editor: ScriptEditor | null = $state(null);

    const doDelete = async () => {
        if (script) {
            try {
                isDeleting = true;
                await Scripts.provider?.delete(script);
                isShowingDeletionDialog = false;
                await goto(resolve('/scripts'));
            } finally {
                isDeleting = false;
            }
        }
    };

    const save = async (saved: EditedScript) => {
        await script?.update(saved);
    };
</script>

{#if isLoading || script}
    {#key page.params.scriptTab}
        <TabView
            loading={isLoading}
            fill-screen
            ontabchanged={(tab) =>
                goto(
                    resolve('/scripts/[scriptId]/[scriptTab=scriptTab]', {
                        scriptId: script?.data.id ?? '',
                        scriptTab: tab as 'logs' | 'edit',
                    }),
                )}
        >
            <EntityDeletionDialog
                item={isShowingDeletionDialog ? script : null}
                type-name="script"
                loading={isDeleting}
                ondelete={doDelete}
                onclose={() => (isShowingDeletionDialog = false)}
            />

            {#snippet title()}
                {#if script}
                    <div class="d-flex" style:gap="0.5rem">
                        <span class="flex-grow-1">
                            {script.data.name}
                        </span>

                        <StateControlButtons
                            entity={script}
                            startTooltip="Start script"
                            restartTooltip="Restart script"
                            stopTooltip="Stop script"
                            stopIcon="sign-stop"
                            ondelete={() => (isShowingDeletionDialog = true)}
                        />
                    </div>
                {/if}
            {/snippet}

            {#if script}
                <Tab id="logs" icon="terminal" title="Logs" default={page.params.scriptTab === 'logs'}>
                    <LogViewer sourceType="Script" sourceId={script.data.id} />
                </Tab>

                <Tab id="edit" icon="sliders" title="Edit" default={page.params.scriptTab === 'edit'}>
                    {#if page.params.scriptTab === 'edit'}
                        <ScriptEditor id={script.data.id} script={script.data} bind:this={editor} onsaved={save} />
                    {/if}
                </Tab>
            {/if}
        </TabView>
    {/key}
{:else}
    <View title="Not found">
        <Alert color="warning" style="max-width: 600px">
            <span class="fs-5">The script does not exist or has been deleted.</span>
        </Alert>
    </View>
{/if}
