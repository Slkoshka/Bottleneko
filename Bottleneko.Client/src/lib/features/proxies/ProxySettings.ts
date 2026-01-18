import type { DataTableType, TypedRendererProps } from '$lib/components/DataTable';
import type { LocalProxy } from './provider.svelte';

export type TableType = DataTableType<
    LocalProxy,
    'name' | 'type' | 'address' | 'actions',
    { onedit: (proxy: LocalProxy) => void; ondelete: (proxy: LocalProxy) => void }
>;

export type RendererProps = TypedRendererProps<TableType>;
