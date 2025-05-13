import { Link } from 'react-router-dom';
import { useConnections } from '../connections/context';
import ProtocolIcon from '../connections/ProtocolIcon';

export default function MessageConnectionDisplay({ connectionId }: { connectionId: string }) {
    const connections = useConnections();

    return (
        <Link to={`/connections/${connectionId}`} className="btn btn-primary btn-sm px-1 py-0">
            <ProtocolIcon protocol={connections?.state.list?.find(connection => connection.id === connectionId)?.protocol} />
            {' '}
            {connections?.state.list?.find(connection => connection.id === connectionId)?.name ?? `Connection #${connectionId}`}
        </Link>
    );
}
