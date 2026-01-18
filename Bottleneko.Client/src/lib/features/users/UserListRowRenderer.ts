import type { TypedRowRendererProps } from '$lib/components/DataTable';
import type { LocalUser } from './provider.svelte';
import type { TableType } from './UserSettings';

export interface Props extends TypedRowRendererProps<TableType> {
    onedit: (user: LocalUser) => void;
    ondelete: (user: LocalUser) => void;
}
