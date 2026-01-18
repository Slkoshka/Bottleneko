import type { Component, Snippet } from 'svelte';
import DataTable from './DataTable.svelte';
import type { MouseEventHandler } from 'svelte/elements';

export interface RowRendererProps<T, Columns extends Record<string, TableColumn | undefined>> {
    row: T;
    column: keyof Columns;
}

export interface TableColumn {
    header: Snippet | string;
    class?: string;
    style?: string;
}

export interface TableCell {
    onclick?: MouseEventHandler<HTMLTableCellElement>;
    class?: string;
    style?: string;
}

export interface TableRow<T, Columns extends string> {
    id: string;
    onclick?: MouseEventHandler<HTMLTableRowElement>;
    class?: string;
    style?: string;
    cells: Record<Columns, TableCell>;
    data: T;
}

export interface Props<
    T,
    Columns extends Record<string, TableColumn | undefined>,
    RendererProps extends RowRendererProps<T, Columns>,
> {
    class?: string;
    title?: Snippet | string;
    renderer: Component<RendererProps>;
    rendererProps: (props: RowRendererProps<T, Columns>) => RendererProps;
    startHeaderExtra?: Snippet;
    endHeaderExtra?: Snippet;
    placeholder?: Snippet | string;
    'highlight-header'?: boolean;
    columns: Columns;
    rows?: TableRow<T, Extract<keyof Columns, string>>[];
    variant?: 'entity-list' | 'message-history' | 'small-table' | undefined;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
type ExtractRow<Type> = Type extends DataTableType<infer _0, infer _1, infer _2, infer _3> ? Type['row'] : never;
/* eslint-disable @typescript-eslint/no-unused-vars */
type ExtractColumnRecord<Type> =
    Type extends DataTableType<infer _0, infer _1, infer _2, infer _3> ? Type['columnRecord'] : never;
/* eslint-disable @typescript-eslint/no-unused-vars */
type ExtractExtraRendererProps<Type> =
    Type extends DataTableType<infer _0, infer _1, infer _2, infer _3> ? Type['extraRendererProps'] : never;

export interface DataTableType<
    T extends object,
    Columns extends string,
    ExtraRendererProps extends object = object,
    ColumnsRecord extends Record<Columns, TableColumn | undefined> = Record<Columns, TableColumn | undefined>,
> {
    row: T;
    columns: Columns;
    extraRendererProps: ExtraRendererProps;
    columnRecord: ColumnsRecord;
}

export type TypedDataTable<T> = typeof DataTable<
    ExtractRow<T>,
    ExtractColumnRecord<T>,
    ExtractExtraRendererProps<T> & RowRendererProps<ExtractRow<T>, ExtractColumnRecord<T>>
>;

export type TypedRowRendererProps<T> = RowRendererProps<ExtractRow<T>, ExtractColumnRecord<T>>;

export type TypedRowExtraRendererProps<T> = ExtractExtraRendererProps<T> & TypedRowRendererProps<T>;

export type TypedRendererProps<T> = (props: TypedRowRendererProps<T>) => TypedRowExtraRendererProps<T>;
