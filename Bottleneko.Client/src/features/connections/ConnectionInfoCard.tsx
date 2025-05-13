import { Button, Card, Form, Table } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useCallback } from 'react';
import api from '../api';
import { useAsync } from '../../app/hooks';
import { ConnectionStatus } from '../api/dtos.gen';
import IconButton from '../../components/IconButton';
import ConnectionStatusIcon from './ConnectionStatusIcon';
import ProtocolIcon from './ProtocolIcon';
import { useConnections } from './context';
import { AnyConnectionDto } from '.';

export default function ConnectionInfoCard({ connection, onDelete, className = '', props }: { connection: AnyConnectionDto; onDelete: () => void; className?: string; props?: object }) {
    const connections = useConnections();

    const canBeStarted = connection.status === ConnectionStatus.NotConnected || connection.status === ConnectionStatus.Error;
    const canBeRestarted = connection.status !== ConnectionStatus.NotConnected && connection.status !== ConnectionStatus.Stopping && connection.status !== ConnectionStatus.Error;
    const canBeStopped = connection.status !== ConnectionStatus.NotConnected && connection.status !== ConnectionStatus.Stopping && connection.status !== ConnectionStatus.Error;

    const [refresh, isRefreshing] = useAsync(useCallback(async () => connections?.actions.updated(await api.connections.get(connection.id)), [connection, connections?.actions]));

    const [startConnection, isStarting] = useAsync(useCallback(() => api.connections.start(connection.id).then(refresh), [connection, refresh]));
    const [restartConnection, isRestarting] = useAsync(useCallback(() => api.connections.restart(connection.id).then(refresh), [connection, refresh]));
    const [stopConnection, isStopping] = useAsync(useCallback(() => api.connections.stop(connection.id).then(refresh), [connection, refresh]));

    const [toggleAutoStart, isUpdatingAutoStart] = useAsync(useCallback(() => api.connections.update(connection.id, { autoStart: !connection.autoStart }).then(refresh), [connection, refresh]));

    const isLoading = isRefreshing || isStarting || isRestarting || isStopping || isUpdatingAutoStart;

    return (
        <Card className={`dashboard-card ${className}`} {...props}>
            <Card.Header style={{ display: 'grid', gap: '0.6em', gridTemplateColumns: '0fr 1fr 0fr' }}>
                <LinkContainer to={`/connections/${connection.id}`}>
                    <IconButton as="a" icon="gear-fill" tooltip="View connection information and settings" />
                </LinkContainer>

                <div className="flex-grow-1 text-truncate">
                    <span className="fs-5">
                        <strong>{connection.name}</strong>
                    </span>
                </div>

                <Form>
                    <Form.Switch disabled={isLoading} style={{ fontSize: '1.25em', width: '10rem' }} checked={connection.autoStart} onChange={() => { void toggleAutoStart(); }} label="Auto Start" reverse />
                </Form>
            </Card.Header>
            <Card.Body>
                <Table>
                    <tbody>
                        <tr>
                            <td className="w-50">Protocol</td>
                            <td className="w-50">
                                <ProtocolIcon protocol={connection.protocol} />
                                {' '}
                                {connection.protocol}
                            </td>
                        </tr>
                        <tr>
                            <td className="w-50">Status</td>
                            <td className="w-50"><ConnectionStatusIcon status={connection.status} showLabel /></td>
                        </tr>
                    </tbody>
                </Table>
                <div style={{ gap: '0.5em', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 0fr' }}>
                    <Button className="flex-grow-1" variant="success" disabled={!canBeStarted || isLoading} onClick={() => { void startConnection(); }}>
                        Start
                    </Button>
                    <Button className="flex-grow-1" variant="warning" disabled={!canBeRestarted || isLoading} onClick={() => { void restartConnection(); }}>
                        Restart
                    </Button>
                    <Button className="flex-grow-1" variant="danger" disabled={!canBeStopped || isLoading} onClick={() => { void stopConnection(); }}>
                        Stop
                    </Button>
                    <IconButton icon="trash3-fill" tooltip="Delete connection" style={{ padding: '0.5em', height: '2.5em' }} variant="outline-danger" onClick={onDelete} />
                </div>
            </Card.Body>
        </Card>
    );
}
