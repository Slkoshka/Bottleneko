import './table.scss';
import { Card, Table } from 'react-bootstrap';
import { CSSProperties, ReactElement, ReactNode } from 'react';
import LoadingBanner from '../LoadingBanner';
import HeaderExtra, { HeaderExtraProps } from '../HeaderExtra';
import { splitChildren } from '../../app/utils';
import { ColumnRenderer, TableColumn } from '.';

export default function ScrollableTable<T>({ columns, data, render, title, highlightHeader, placeholder, children, style, className }: { columns: TableColumn[]; data: T[] | undefined | null; render: ColumnRenderer<T>; title?: ReactNode; highlightHeader?: boolean; placeholder?: () => ReactNode; children?: ReactNode; style?: CSSProperties; className?: string }) {
    const [headerExtra] = splitChildren(children, [HeaderExtra]);

    const renderRow = (item: T) => {
        const row = render(item);
        return (
            <tr key={row.id} className={row.className} style={row.style} onClick={row.onClick}>
                {
                    columns.map(column => (
                        column.id in row.columns
                            ? (
                                    <td key={column.id} className={row.columns[column.id].className} style={row.columns[column.id].style} onClick={row.columns[column.id].onClick}>
                                        {row.columns[column.id].content}
                                    </td>
                                )
                            : (
                                    <td key={column.id}></td>
                                )
                    ))
                }
            </tr>
        );
    };

    return (
        <Card className={`scrollable-table-card h-100 ${className ?? ''}`}>
            {
                !!title || headerExtra.length > 0
                    ? (
                            <Card.Header className={`info-card-header ${highlightHeader ? 'highlight' : ''}`} style={{ display: 'grid', gap: '0.6em', gridTemplateColumns: '0fr 1fr 0fr' }}>
                                <div>{(headerExtra as ReactElement<HeaderExtraProps>[]).filter(item => item.props.position === 'start')}</div>
                                <div className="flex-grow-1 text-truncate">
                                    <span className="fs-5">
                                        {title}
                                    </span>
                                </div>
                                <div>{(headerExtra as ReactElement<HeaderExtraProps>[]).filter(item => item.props.position === 'end')}</div>
                            </Card.Header>
                        )
                    : <></>
            }
            <Card.Body className="d-flex flex-column h-100" style={{ overflowY: 'hidden' }}>
                <div className="flex-grow-1" style={{ overflowY: 'scroll' }}>
                    <Table size="sm" className={`scrollable-table sticky-header mb-0 ${!data || data.length === 0 ? 'h-100' : ''}`} style={style}>
                        <thead style={{ height: '1em' }}>
                            <tr>
                                {
                                    columns.map(column => (
                                        <th key={column.id} className={column.className} style={column.style}>{column.header}</th>
                                    ))
                                }
                            </tr>
                        </thead>
                        <tbody style={{ height: '100%' }}>
                            {
                                data === null || data === undefined
                                    ? <tr className=".placeholder"><td colSpan={columns.length}><LoadingBanner size="xl" /></td></tr>
                                    : data.length === 0 ? <tr className="table-placeholder"><td colSpan={columns.length} className="text-center align-middle">{placeholder?.()}</td></tr> : data.map(renderRow)
                            }
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );
}

ScrollableTable.HeaderExtra = HeaderExtra;
