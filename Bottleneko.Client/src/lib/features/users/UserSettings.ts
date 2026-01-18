import type { DataTableType, TypedRendererProps } from '$lib/components/DataTable';
import type { LocalUser } from './provider.svelte';

export type TableType = DataTableType<
    LocalUser,
    'id' | 'login' | 'displayName' | 'actions',
    { onedit: (user: LocalUser) => void; ondelete: (user: LocalUser) => void }
>;

export type RendererProps = TypedRendererProps<TableType>;
