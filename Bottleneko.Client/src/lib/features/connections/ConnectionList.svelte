<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { Connections, protocols } from '.';
    import { LocalConnection } from './provider.svelte';
    import EntityDeletionDialog from '$lib/components/EntityDeletionDialog.svelte';
    import { Button, Card, CardBody, CardHeader, Input } from '@sveltestrap/sveltestrap';
    import ProtocolIcon from './ProtocolIcon.svelte';
    import ConnectionStatusIcon from './ConnectionStatusIcon.svelte';
    import StateControlButtons from '$lib/components/StateControlButtons.svelte';
    import MouseBlocker from '$lib/components/MouseBlocker.svelte';

    let deletingConnection: LocalConnection | null = $state(null);
    let isDeleting = $state(false);

    const doDelete = async () => {
        if (deletingConnection) {
            try {
                isDeleting = true;
                await Connections.provider?.delete(deletingConnection);
            } finally {
                isDeleting = false;
                deletingConnection = null;
            }
        }
    };
</script>

<div class="h-100 d-flex flex-column" style="max-width: 600px; width: 100%; gap: 1rem">
    <EntityDeletionDialog
        item={deletingConnection}
        type-name="connection"
        loading={isDeleting}
        ondelete={doDelete}
        onclose={() => (deletingConnection = null)}
    />

    <Button color="primary" href={resolve('/connections/add')}>Add new connection</Button>

    {#if Connections.provider !== null}
        {#each Connections.provider.list as connection (connection.data.id)}
            <Card>
                <CardHeader
                    class="highlight fs-5 d-flex pe-2"
                    style="cursor: pointer"
                    onclick={async () => {
                        await goto(resolve('/connections/[connectionId]', { connectionId: connection.data.id }));
                    }}
                >
                    <ProtocolIcon protocol={connection.data.protocol} />
                    <div class="ms-2 text-collapse">
                        {connection.data.name}
                    </div>
                    <div class="ms-auto">
                        <MouseBlocker>
                            <StateControlButtons
                                entity={connection}
                                startTooltip="Connect"
                                restartTooltip="Reconnect"
                                stopTooltip="Disconnect"
                                startIcon="wifi"
                                stopIcon="wifi-off"
                                ondelete={() => {
                                    deletingConnection = connection;
                                }}
                                size="2em"
                                variant="dark"
                            />
                        </MouseBlocker>
                    </div>
                </CardHeader>
                <CardBody>
                    <div class="d-grid" style="grid-template-columns: 0.5fr 1fr; gap: 0.5em 0">
                        <div>Protocol</div>
                        <div>{protocols[connection.data.protocol].name}</div>
                        <div>Status</div>
                        <div><ConnectionStatusIcon status={connection.data.extendedStatus} show-label /></div>
                        <div>Auto start</div>
                        <div>
                            <Input
                                type="switch"
                                checked={connection.data.autoStart}
                                onchange={async (e: Event & { currentTarget: HTMLElement }) => {
                                    await connection.setAutoStart((e.currentTarget as HTMLInputElement).checked);
                                }}
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>
        {/each}
    {/if}
</div>
