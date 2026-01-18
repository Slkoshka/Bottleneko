import type { TypedRowRendererProps } from '$lib/components/DataTable';
import type { LocalScript } from './provider.svelte';
import type { TableType } from './ScriptList';

export interface Props extends TypedRowRendererProps<TableType> {
    ondelete: (script: LocalScript) => void;
}
