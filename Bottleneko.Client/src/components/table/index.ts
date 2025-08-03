import { CSSProperties, MouseEventHandler, ReactNode } from 'react';

export interface TableColumn {
    id: string;
    header: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export interface TableRowColumn {
    content: ReactNode;
    onClick?: MouseEventHandler<HTMLTableCellElement>;
    className?: string;
    style?: CSSProperties;
}

export interface TableRow {
    id: string;
    onClick?: MouseEventHandler<HTMLTableRowElement>;
    className?: string;
    style?: CSSProperties;
    columns: Record<string, TableRowColumn>;
}

export type ColumnRenderer<T> = (data: T) => TableRow;
