<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { Scripts } from '.';
    import { LocalScript } from './provider.svelte';
    import IconButton from '$lib/components/IconButton.svelte';
    import EntityDeletionDialog from '$lib/components/EntityDeletionDialog.svelte';
    import ScriptListRowRenderer from './ScriptListRowRenderer.svelte';
    import DataTable from '$lib/components/DataTable.svelte';
    import type { TypedDataTable } from '$lib/components/DataTable';
    import type { RendererProps, TableType } from './ScriptList';
    import { Button, Card, CardBody, CardHeader, DropdownItem, Input } from '@sveltestrap/sveltestrap';
    import MouseBlocker from '$lib/components/MouseBlocker.svelte';
    import StateControlButtons from '$lib/components/StateControlButtons.svelte';
    import ScriptStatusIcon from './ScriptStatusIcon.svelte';
    import InlineIcon from '$lib/components/InlineIcon.svelte';

    let deletingScript: LocalScript | null = $state(null);
    let isDeleting = $state(false);

    const doDelete = async () => {
        if (deletingScript) {
            try {
                isDeleting = true;
                await Scripts.provider?.delete(deletingScript);
            } finally {
                isDeleting = false;
                deletingScript = null;
            }
        }
    };

    const ScriptListTable = DataTable as TypedDataTable<TableType>;
    const rendererProps: RendererProps = (props) => {
        return {
            ...props,
            ondelete(script) {
                deletingScript = script;
            },
        };
    };
</script>

<div class="h-100 d-flex flex-column" style="max-width: 600px; width: 100%; gap: 1rem">
    <EntityDeletionDialog
        item={deletingScript}
        type-name="script"
        loading={isDeleting}
        ondelete={doDelete}
        onclose={() => (deletingScript = null)}
    />

    <Button color="primary" href={resolve('/scripts/add')}>Create new script</Button>

    {#if Scripts.provider !== null}
        {#each Scripts.provider.list as script (script.data.id)}
            <Card>
                <CardHeader
                    class="highlight fs-5 d-flex px-2"
                    style="cursor: pointer"
                    onclick={async () => {
                        await goto(resolve('/scripts/[scriptId]', { scriptId: script.data.id }));
                    }}
                >
                    <div class="ms-2 text-collapse">
                        {script.data.name}
                    </div>
                    <div class="ms-auto">
                        <MouseBlocker>
                            <StateControlButtons
                                entity={script}
                                startTooltip="Start script"
                                restartTooltip="Restart script"
                                stopTooltip="Stop script"
                                stopIcon="sign-stop"
                                ondelete={() => (deletingScript = script)}
                                size="2em"
                                variant="dark"
                            >
                                {#snippet menuTop()}
                                    <DropdownItem
                                        onclick={async () => {
                                            await goto(
                                                resolve('/scripts/[scriptId]/[scriptTab=scriptTab]', {
                                                    scriptId: script.data.id,
                                                    scriptTab: 'logs',
                                                }),
                                            );
                                        }}
                                    >
                                        <InlineIcon icon="terminal" />
                                        <span style:margin-left="0.5em">Logs</span>
                                    </DropdownItem>
                                    <DropdownItem
                                        onclick={async () => {
                                            await goto(
                                                resolve('/scripts/[scriptId]/[scriptTab=scriptTab]', {
                                                    scriptId: script.data.id,
                                                    scriptTab: 'edit',
                                                }),
                                            );
                                        }}
                                    >
                                        <InlineIcon icon="sliders" />
                                        <span style:margin-left="0.5em">Edit</span>
                                    </DropdownItem>
                                    <DropdownItem divider />
                                {/snippet}
                            </StateControlButtons>
                        </MouseBlocker>
                    </div>
                </CardHeader>
                <CardBody>
                    <div class="d-grid" style="grid-template-columns: 0.5fr 1fr; gap: 0.5em 0">
                        <div>Status</div>
                        <div><ScriptStatusIcon status={script.data.status} show-label /></div>
                        <div>Auto start</div>
                        <div>
                            <Input
                                type="switch"
                                checked={script.data.autoStart}
                                onchange={async (e: Event & { currentTarget: HTMLElement }) => {
                                    await script.setAutoStart((e.currentTarget as HTMLInputElement).checked);
                                }}
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>
        {/each}
    {/if}
</div>

<div class="script-list h-100">
    <EntityDeletionDialog
        item={deletingScript}
        type-name="script"
        loading={isDeleting}
        ondelete={doDelete}
        onclose={() => (deletingScript = null)}
    />

    <ScriptListTable
        title="Script list"
        highlight-header
        variant="entity-list"
        renderer={ScriptListRowRenderer}
        {rendererProps}
        columns={{
            name: { header: 'Script Name', style: 'width: 10em' },
            description: { header: 'Description', class: 'text-collapse' },
            status: { header: 'Status', style: 'width: 10em' },
            autostart: { header: 'Auto Start', style: 'width: 7em' },
            actions: { header: '', style: 'width: 8em' },
        }}
        rows={Scripts.provider?.list?.map((script) => ({
            id: script.data.id,
            onclick: () => goto(resolve('/scripts/[scriptId]', { scriptId: script.data.id })),
            cells: {
                name: {
                    class: 'text-collapse',
                    style: 'vertical-align: middle; width: 10em',
                },
                description: {
                    class: 'text-collapse',
                    style: 'vertical-align: middle; max-width: 0',
                },
                status: {},
                autostart: {},
                actions: {},
            },
            data: script,
        }))}
    >
        {#snippet placeholder()}
            <em class="text-secondary fst-italic">(no scripts)</em>
        {/snippet}

        {#snippet endHeaderExtra()}
            <IconButton href={resolve('/scripts/add')} icon="plus-lg" tooltip="Add script" variant="dark" />
        {/snippet}
    </ScriptListTable>
</div>
