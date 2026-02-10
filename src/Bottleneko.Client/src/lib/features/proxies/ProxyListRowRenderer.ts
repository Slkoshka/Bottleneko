import type { TypedRowRendererProps } from '$lib/components/DataTable';
import type { LocalProxy } from './provider.svelte';
import type { TableType } from './ProxySettings';

export interface Props extends TypedRowRendererProps<TableType> {
    onedit: (proxy: LocalProxy) => void;
    ondelete: (proxy: LocalProxy) => void;
}
