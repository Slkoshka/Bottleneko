<script lang="ts">
    import './style.scss';
    import type { ProxyDto } from '$lib/api/dtos.gen';
    import EntityDeletionDialog from '$lib/components/EntityDeletionDialog.svelte';
    import IconButton from '$lib/components/IconButton.svelte';
    import { type TypedDataTable } from '$lib/components/DataTable';
    import DataTable from '$lib/components/DataTable.svelte';
    import { Proxies } from '../proxies';
    import type { LocalProxy, ProxiesProvider } from '../proxies/provider.svelte';
    import ProxyEditor from './ProxyEditor.svelte';
    import ProxyListRowRenderer from './ProxyListRowRenderer.svelte';
    import type { TableType, RendererProps } from './ProxySettings';

    let editorState = $state({ shown: false, editing: null as ProxyDto | null });

    let deletingProxy: LocalProxy | null = $state(null);
    let isDeleting = $state(false);

    const ondelete = async () => {
        if (deletingProxy) {
            try {
                isDeleting = true;
                await Proxies.provider?.delete(deletingProxy);
            } finally {
                isDeleting = false;
                deletingProxy = null;
            }
        }
    };

    const ProxyListTable = DataTable as TypedDataTable<TableType>;
    const rendererProps: RendererProps = (props) => {
        return {
            ...props,
            onedit(proxy) {
                editorState = { shown: true, editing: proxy.data };
            },
            ondelete(proxy) {
                deletingProxy = proxy;
            },
        };
    };
</script>

<ProxyEditor
    show={editorState.shown}
    proxy={editorState.editing}
    onsuccess={async (proxy: ProxiesProvider['$update']) => {
        if (editorState.editing) {
            const localProxy = Proxies.provider?.list?.find((p) => p.data.id === editorState.editing?.id);
            if (localProxy) {
                await localProxy.update(proxy);
            }
        } else {
            await Proxies.provider?.add(proxy);
        }
        editorState = { shown: false, editing: null };
    }}
    onclose={() => (editorState = { shown: false, editing: editorState.editing })}
/>

<div class="proxy-list" style:height="500px">
    <EntityDeletionDialog
        item={deletingProxy}
        type-name="proxy"
        loading={isDeleting}
        {ondelete}
        onclose={() => (deletingProxy = null)}
    />

    <ProxyListTable
        title="Proxy servers"
        highlight-header
        variant="small-table"
        renderer={ProxyListRowRenderer}
        {rendererProps}
        columns={{
            name: { header: 'Proxy Name' },
            type: { header: 'Type', style: 'width: 5em' },
            address: { header: 'Address', style: 'width: 15em' },
            actions: { header: '', style: 'width: 5em' },
        }}
        rows={Proxies.provider?.list?.map((proxy) => ({
            id: proxy.data.id,
            onclick: () => (editorState = { shown: true, editing: proxy.data }),
            cells: {
                name: {
                    class: 'text-collapse',
                    style: 'vertical-align: middle',
                },
                type: {
                    style: 'vertical-align: middle',
                },
                address: {
                    style: 'vertical-align: middle',
                },
                actions: {},
            },
            data: proxy,
        }))}
    >
        {#snippet placeholder()}
            <em class="text-secondary fst-italic">(no proxies)</em>
        {/snippet}

        {#snippet endHeaderExtra()}
            <IconButton
                icon="plus-lg"
                tooltip="Add proxy server"
                variant="dark"
                onclick={() => (editorState = { shown: true, editing: null })}
            />
        {/snippet}
    </ProxyListTable>
</div>
