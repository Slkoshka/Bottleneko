import { Table } from 'react-bootstrap';
import { useState } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import LoadingBanner from '../../../components/LoadingBanner';
import { useConnections } from '../../connections/context';
import { ConnectionStatus } from '../../api/dtos.gen';
import { useInterval } from '../../../app/hooks';
import IconButton from '../../../components/IconButton';
import InlineIcon from '../../../components/InlineIcon';
import DashboardCard from './DashboardCard';

export default function ConnectionsDashboardCard() {
    const [showBlinking, setShowBlinking] = useState(false);
    const connections = useConnections();
    const connectionsWithErrors = connections?.state.list ? connections.state.list.filter(c => c.status === ConnectionStatus.Error) : [];

    useInterval(() => {
        setShowBlinking(blinking => !blinking);
    }, 500);

    return (
        <DashboardCard title={(
            <div style={{ display: 'grid', gap: '0.6em', gridTemplateColumns: '1fr 0fr' }}>
                Connections

                <LinkContainer to="/connections/">
                    <IconButton as="a" icon="gear-fill" tooltip="View connections" />
                </LinkContainer>
            </div>
        )}
        >
            {connections?.state.list
                ? (
                        <Table>
                            <tbody>
                                <tr>
                                    <td className="w-50">Connected</td>
                                    <td className="w-50">
                                        {connections.state.list.filter(c => c.status === ConnectionStatus.Connected).length}
                                        {' '}
                                        of
                                        {' '}
                                        {connections.state.list.length}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Failed</td>
                                    <td>
                                        {connectionsWithErrors.length}
                                        {' '}
                                        of
                                        {' '}
                                        {connections.state.list.length}
                                        {' '}
                                        {showBlinking && connectionsWithErrors.length > 0
                                            ? (
                                                    <InlineIcon className="text-danger" size="1.5em" icon="exclamation-diamond-fill" />
                                                )
                                            : null}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="w-50">Disconnected</td>
                                    <td className="w-50">
                                        {connections.state.list.filter(c => c.status === ConnectionStatus.NotConnected).length}
                                        {' '}
                                        of
                                        {' '}
                                        {connections.state.list.length}
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    )
                : <LoadingBanner />}
        </DashboardCard>
    );
}
