import type { DataTableType, TypedRendererProps } from '$lib/components/DataTable';
import type { LocalScript } from './provider.svelte';

export type TableType = DataTableType<
    LocalScript,
    'name' | 'description' | 'status' | 'autostart' | 'actions',
    { ondelete: (script: LocalScript) => void }
>;

export type RendererProps = TypedRendererProps<TableType>;
