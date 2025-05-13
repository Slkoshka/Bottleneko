import './LogViewer.css';
import { ToggleButton, ButtonGroup, Card, Table } from 'react-bootstrap';
import { useCallback, useState } from 'react';
import dateFormat from 'dateformat';
import { useSubscription } from '../websockets/hooks';
import { LogLetter, LogSeverity, LogSourceType } from '../api/dtos.gen';
import LoadingBanner from '../../components/LoadingBanner';
import LogSourceDisplay from './LogSourceDisplay';

type LogSeverityFilter = Record<LogSeverity, boolean>;

export default function LogViewer({ sourceType, sourceId }: { sourceType?: LogSourceType; sourceId?: string }) {
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

    const showSource = sourceType !== LogSourceType.Connection && sourceType !== LogSourceType.Script;

    const getSeverityButtonVariant = (severity: LogSeverity) => {
        switch (severity) {
            case LogSeverity.Critical:
            case LogSeverity.Error:
                return 'danger';

            case LogSeverity.Warning:
                return 'warning';

            case LogSeverity.Info:
                return 'primary';

            default:
                return 'secondary';
        }
    };

    return (
        <>
            <Card className="h-100" style={{ margin: '0.5em' }}>
                <Card.Body className="d-flex flex-column h-100" style={{ gap: '1em' }}>
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
                                    style={{ }}
                                >
                                    {severity}
                                </ToggleButton>
                            ))
                        }
                    </ButtonGroup>

                    <div className="flex-grow-1" style={{ overflowY: 'scroll' }}>
                        <Table style={{ minWidth: '50em' }} size="sm" className="log-viewer">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    {
                                        showSource
                                            ? <th>Source</th>
                                            : <></>
                                    }
                                    <th>Category</th>
                                    <th>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events && events.length > 0
                                    ? events.map(message => (
                                            <tr key={message.id} className={`log-message log-message-${message.severity.toLowerCase()} font-monospace`}>
                                                <td className="log-message-timestamp">{dateFormat(new Date(message.timestamp), 'yyyy-mm-dd HH:MM:ss.l')}</td>
                                                {
                                                    showSource
                                                        ? (
                                                                <td className="log-message-source">
                                                                    <LogSourceDisplay sourceType={message.sourceType} sourceId={message.sourceId} />
                                                                </td>
                                                            )
                                                        : <></>
                                                }

                                                <td className="log-message-category">{message.category}</td>
                                                <td className="log-message-text">{message.text}</td>
                                            </tr>
                                        ))
                                    : (
                                            <tr>
                                                <td colSpan={showSource ? 4 : 3} className="text-center">
                                                    {
                                                        events
                                                            ? <em className="text-secondary fst-italic">(no messages)</em>
                                                            : <LoadingBanner />
                                                    }
                                                </td>
                                            </tr>
                                        )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </>
    );
}
