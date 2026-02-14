<script lang="ts">
    import {
        Connections,
        protocols,
        type ConnectionConfigEditor,
        type ConnectionDefinition,
    } from '$lib/features/connections';
    import View from '$lib/components/View.svelte';
    import { page } from '$app/state';
    import { Alert, Button } from '@sveltestrap/sveltestrap';
    import TabView from '$lib/components/TabView.svelte';
    import ProtocolIcon from '$lib/features/connections/ProtocolIcon.svelte';
    import StateControlButtons from '$lib/components/StateControlButtons.svelte';
    import EntityDeletionDialog from '$lib/components/EntityDeletionDialog.svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte';
    import Tab from '$lib/components/Tab.svelte';
    import MessageHistoryViewer from '$lib/features/messages/MessageHistoryViewer.svelte';
    import LogViewer from '$lib/features/log/LogViewer.svelte';
    import { resolved } from '$lib';

    const connection = $derived(
        Connections.provider?.list?.find((connection) => connection.data.id === page.params.connectionId) ?? null,
    );
    let isDeleting = $state(false);

    const isLoading = $derived(Connections.provider?.list === null || isDeleting);
    let isShowingDeletionDialog = $state(false);

    let savingDefinition: ConnectionDefinition | null = $state(null);
    let isSaving = $state(false);

    const Editor = $derived(connection ? protocols[connection.data.protocol].editor : null);
    let editor: ConnectionConfigEditor | null = $state(null);

    const doDelete = async () => {
        if (connection) {
            try {
                isDeleting = true;
                await Connections.provider?.delete(connection);
                isShowingDeletionDialog = false;
                await goto(resolve('/connections'));
            } finally {
                isDeleting = false;
            }
        }
    };
</script>

{#if isLoading || connection}
    {#key page.params.connectionTab}
        <TabView
            loading={isLoading}
            fill-screen={page.params.connectionTab !== 'parameters'}
            ontabchanged={(tab) =>
                goto(
                    resolve('/connections/[connectionId]/[connectionTab=connectionTab]', {
                        connectionId: connection?.data.id ?? '',
                        connectionTab: tab as string,
                    }),
                )}
        >
            <EntityDeletionDialog
                item={isShowingDeletionDialog ? connection : null}
                type-name="connection"
                loading={isDeleting}
                ondelete={doDelete}
                onclose={() => (isShowingDeletionDialog = false)}
            />

            <ConfirmationDialog
                show={!!savingDefinition}
                onclose={() => (savingDefinition = null)}
                onaccept={async () => {
                    if (connection && savingDefinition) {
                        try {
                            isSaving = true;
                            await connection.update(savingDefinition);
                            savingDefinition = null;
                        } finally {
                            isSaving = false;
                        }
                    }
                }}
                acceptText="Apply"
                loading={isSaving}
            >
                <p>Are you sure you want to apply new settings?</p>
                <p>
                    This may cause the connection to be restarted, and it might miss messages or other events that have
                    occured while it was reconnecting.
                </p>
            </ConfirmationDialog>

            {#snippet title()}
                {#if connection}
                    <div class="d-flex" style:gap="0.5rem">
                        <span class="flex-grow-1">
                            <ProtocolIcon protocol={connection.data.protocol} />
                            {connection.data.name}
                        </span>

                        <StateControlButtons
                            entity={connection}
                            startTooltip="Connect"
                            restartTooltip="Reconnect"
                            stopTooltip="Disconnect"
                            startIcon="wifi"
                            stopIcon="wifi-off"
                            ondelete={() => (isShowingDeletionDialog = true)}
                        />
                    </div>
                {/if}
            {/snippet}

            {#if connection}
                <Tab
                    id="messages"
                    icon="chat-left-text"
                    title="Messages"
                    default={page.params.connectionTab === 'messages'}
                >
                    <MessageHistoryViewer class="h-100 fill" connectionId={connection.data.id} />
                </Tab>

                <Tab
                    id="parameters"
                    icon="sliders"
                    title="Parameters"
                    default={page.params.connectionTab === 'parameters'}
                >
                    <Editor
                        definition={connection.data}
                        bind:this={editor}
                        onsubmit={async (definition) => {
                            savingDefinition = definition;
                            await resolved(undefined);
                        }}
                    />
                    <hr />
                    <div class="d-flex justify-content-center mx-auto pb-3">
                        <Button
                            size="lg"
                            class="mx-2"
                            style="width: calc(max(25%, 10rem))"
                            color="primary"
                            onclick={() => editor?.submit()}
                            disabled={isSaving}>Apply</Button
                        >
                    </div>
                </Tab>

                <Tab id="logs" icon="terminal" title="Logs" default={page.params.connectionTab === 'logs'}>
                    <LogViewer sourceType="Connection" sourceId={connection.data.id} />
                </Tab>
            {/if}
        </TabView>
    {/key}
{:else}
    <View title="Not found">
        <Alert color="warning" style="max-width: 600px">
            <span class="fs-5">The connection does not exist or has been deleted.</span>
        </Alert>
    </View>
{/if}
