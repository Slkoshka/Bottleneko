import View from '../../components/views/View';
import { useEntityDeletion } from '../../app/hooks';
import { ConnectionEntityConfig, useConnections } from './context';
import ConnectionList from './ConnectionList';

export default function ConnectionsView() {
    const connections = useConnections();
    const { deleteEntity, dialog } = useEntityDeletion<ConnectionEntityConfig>(connections);

    return (
        <View
            title={(
                <div className="d-flex" style={{ gap: '0.5rem' }}>
                    <span className="flex-grow-1">
                        Connections
                    </span>
                </div>
            )}
            loading={!connections?.state.list}
            fillScreen
        >
            {dialog}

            <ConnectionList onDelete={(connection) => { deleteEntity(connection); }} />
        </View>
    );
}
