import { useCallback } from 'react';
import { Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import ScrollableTable from '../../components/table/ScrollableTable';
import StateControlButtons from '../../components/StateControlButtons';
import IconButton from '../../components/IconButton';
import { TableRow } from '../../components/table';
import { useConnections } from './context';
import ProtocolIcon from './ProtocolIcon';
import ConnectionStatusIcon from './ConnectionStatusIcon';
import { ConnectionState } from './ConnectionsProvider';

export default function ConnectionList({ onDelete }: { onDelete: (connection: ConnectionState) => void }) {
    const connections = useConnections();
    const navigate = useNavigate();

    const columns = [
        { id: 'name', header: 'Connection Name', className: 'text-collapse' },
        { id: 'status', header: 'Status', style: { width: '10em' } },
        { id: 'autostart', header: 'Auto Start', style: { width: '7em' } },
        { id: 'actions', header: '', style: { width: '8em' } },
    ];

    const renderRow = useCallback((connection: ConnectionState): TableRow => ({
        id: connection.data.id,
        onClick: () => { void navigate(`/connections/${connection.data.id}`); },
        columns: {
            name: {
                content: (
                    <>
                        <ProtocolIcon protocol={connection.data.protocol} />
                        {' '}
                        {connection.data.name}
                    </>
                ),
                className: 'text-collapse',
                style: { verticalAlign: 'middle' },
            },
            status: {
                content: <ConnectionStatusIcon status={connection.data.extendedStatus} showLabel />,
                style: { verticalAlign: 'middle' },
            },
            autostart: {
                content: <Form.Switch style={{ fontSize: '1.25em' }} checked={connection.data.autoStart} disabled={connection.isLoading} onChange={() => { void connection.setAutoStart(!connection.data.autoStart); }} />,
                onClick: (e) => { e.stopPropagation(); },
            },
            actions: {
                content: (
                    <div className="w-100">
                        <StateControlButtons
                            canStart={connection.canStart}
                            onStart={() => { void connection.start(); }}
                            startTooltip="Connect"

                            canRestart={connection.canRestart}
                            onRestart={() => { void connection.restart(); }}
                            restartTooltip="Reconnect"

                            canStop={connection.canStop}
                            onStop={() => { void connection.stop(); }}
                            stopTooltip="Disconnect"

                            canDelete={true}
                            onDelete={() => { onDelete(connection); }}

                            size="2em"
                        />
                    </div>
                ),
                onClick: (e) => { e.stopPropagation(); },
            },
        },
    }), [navigate, onDelete]);

    return (
        <div className="connection-list h-100">
            <ScrollableTable<ConnectionState>
                columns={columns}
                render={renderRow}
                data={connections?.state.list}
                placeholder={() => <em className="text-secondary fst-italic">(no connections)</em>}
                title="Connection list"
                className="entity-list"
                highlightHeader
            >
                <ScrollableTable.HeaderExtra position="end">
                    <LinkContainer to="/connections/add">
                        <IconButton icon="plus-lg" tooltip="Add connection" variant="dark" />
                    </LinkContainer>
                </ScrollableTable.HeaderExtra>
            </ScrollableTable>
        </div>
    );
}
