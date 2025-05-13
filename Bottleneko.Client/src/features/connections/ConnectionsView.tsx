import { LinkContainer } from 'react-router-bootstrap';
import { Button } from 'react-bootstrap';
import { useCallback, useState } from 'react';
import View from '../../components/View';
import DeleteConfirmationDialog from '../../components/DeleteConfirmationDialog';
import { useAsync } from '../../app/hooks';
import api from '../api';
import ConnectionInfoCard from './ConnectionInfoCard';
import { useConnections } from './context';
import { AnyConnectionDto } from '.';

export default function ConnectionsView() {
    const connections = useConnections();
    const [deletingConnection, setDeletingConnection] = useState<AnyConnectionDto | undefined>(undefined);

    const [deleteConnection] = useAsync(useCallback(async () => {
        if (deletingConnection) {
            try {
                await api.connections.delete(deletingConnection.id);
                connections?.actions.deleted(deletingConnection.id);
            }
            finally {
                setDeletingConnection(undefined);
            }
        }
    }, [deletingConnection, connections?.actions]));

    const getConnectionInfo = (connection: AnyConnectionDto) => {
        return {
            id: {
                name: 'ID',
                value: connection.id,
            },
            protocol: {
                name: 'Protocol',
                value: connection.protocol,
            },
            name: {
                name: 'Name',
                value: connection.name,
            },
        };
    };

    return (
        <View title="Connections" loading={!connections?.state.list}>
            <DeleteConfirmationDialog
                item={deletingConnection}
                itemTypeName="connection"
                onDelete={() => { void deleteConnection(); }}
                onCancel={() => { setDeletingConnection(undefined); }}
                itemInfoBuilder={getConnectionInfo}
            />

            <div className="d-flex flex-column" style={{ gap: '10px', width: 'calc(min(100%, 600px))', maxWidth: '600px' }}>
                <LinkContainer to="/connections/add"><Button size="lg" variant="primary">Add Connection</Button></LinkContainer>

                {connections?.state.list?.map(c => <ConnectionInfoCard key={c.id} connection={c} onDelete={() => { setDeletingConnection(c); }} />) }
            </div>
        </View>
    );
}
