import './LogViewer.scss';
import { ToggleButton, ButtonGroup } from 'react-bootstrap';
import { useCallback, useState } from 'react';
import dateFormat from 'dateformat';
import { useSubscription } from '../websockets/hooks';
import { LogLetter, LogSeverity, LogSourceType } from '../api/dtos.gen';
import { TableColumn } from '../../components/table';
import ScrollableTable from '../../components/table/ScrollableTable';
import LogSourceDisplay from './LogSourceDisplay';

type LogSeverityFilter = Record<LogSeverity, boolean>;

export default function LogViewer({ sourceType, sourceId, className }: { sourceType?: LogSourceType; sourceId?: string; className?: string }) {
    const [severityFilter, setSeverityFilter] = useState<LogSeverityFilter>({
        [LogSeverity.Critical]: true,
        [LogSeverity.Error]: true,
        [LogSeverity.Warning]: true,
        [LogSeverity.Info]: true,
        [LogSeverity.Verbose]: false,
        [LogSeverity.Debug]: false,
    });

    const { events } = useSubscription<LogLetter>({
        subscription: {
            type: 'Logs',
            filter: {
                severities: Object.keys(severityFilter).filter(severity => severityFilter[severity as LogSeverity]) as LogSeverity[],
                sourceType: sourceType ?? null,
                sourceId: sourceId ?? null,
                category: null,
            },
        },
        maxEvents: 500,
    });

    const toggleSeverityFilter = useCallback((severity: LogSeverity) => {
        const newSeverityFilter = { ...severityFilter, [severity]: !severityFilter[severity] };
        setSeverityFilter(newSeverityFilter);
    }, [severityFilter]);

    const getSeverityButtonVariant = (severity: LogSeverity) => {
        switch (severity) {
            case LogSeverity.Critical:
            case LogSeverity.Error:
            case LogSeverity.Warning:
            case LogSeverity.Info:
            case LogSeverity.Verbose:
            case LogSeverity.Debug:
                return 'dark';

            default:
                return 'dark';
        }
    };

    const showSource = sourceType !== LogSourceType.Connection && sourceType !== LogSourceType.Script;

    const columns: TableColumn[] = [];
    columns.push({ id: 'timestamp', header: 'Timestamp' });
    if (!showSource) {
        columns.push({ id: 'source', header: 'Source' });
    }
    columns.push({ id: 'category', header: 'Category' });
    columns.push({ id: 'message', header: 'Message' });

    const renderRow = (message: LogLetter) => ({
        id: message.id,
        className: `log-message log-message-${message.severity.toLowerCase()} font-monospace`,
        columns: {
            timestamp: {
                className: 'log-message-timestamp',
                content: dateFormat(new Date(message.timestamp), 'yyyy-mm-dd HH:MM:ss'),
            },
            source: {
                className: 'log-message-source',
                content: <LogSourceDisplay sourceType={message.sourceType} sourceId={message.sourceId} />,
            },
            category: {
                className: 'log-message-category',
                content: message.category,
            },
            message: {
                className: 'log-message-text',
                content: message.text,
            },
        },
    });

    return (
        <div className="h-100" style={{ padding: '0.5em' }}>
            <ScrollableTable
                columns={columns}
                render={renderRow}
                data={events}
                placeholder={() => <em className="text-secondary fst-italic">(no messages)</em>}
                className={className}
                title="Log Messages"
                highlightHeader
            >
                <ScrollableTable.HeaderExtra position="end">
                    <ButtonGroup style={{ maxWidth: '1000px' }}>
                        {
                            Object.keys(severityFilter).map(severity => (
                                <ToggleButton
                                    key={severity}
                                    variant={`outline-${getSeverityButtonVariant(severity as LogSeverity)}`}
                                    type="checkbox"
                                    id={`log-severity-${severity}`}
                                    className={severityFilter[severity as LogSeverity] ? '' : 'text-white'}
                                    value={severity}
                                    checked={severityFilter[severity as LogSeverity]}
                                    onChange={(e) => { toggleSeverityFilter(e.currentTarget.value as LogSeverity); }}
                                    style={{}}
                                    size="sm"
                                >
                                    {severity}
                                </ToggleButton>
                            ))
                        }
                    </ButtonGroup>
                </ScrollableTable.HeaderExtra>
            </ScrollableTable>
        </div>
    );
}
