import { Link } from 'react-router-dom';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useConnections } from '../connections/context';
import ProtocolIcon from '../connections/ProtocolIcon';

export default function MessageConnectionDisplay({ connectionId }: { connectionId: string }) {
    const connections = useConnections();
    const connection = connections?.state.list?.find(connection => connection.data.id === connectionId);

    if (connection) {
        return (
            <Link to={`/connections/${connectionId}`} className="btn btn-primary btn-sm px-1 py-0">
                <ProtocolIcon protocol={connection.data.protocol} />
                {' '}
                {connection.data.name}
            </Link>
        );
    }
    else {
        const renderTooltip = (props: object) => <Tooltip {...props}>The connection does not exist or has been deleted.</Tooltip>;
        return (
            <OverlayTrigger placement="bottom" overlay={renderTooltip}>
                <Button variant="primary" size="sm" className="px-1 py-0" disabled>
                    {'Connection #' + connectionId}
                </Button>
            </OverlayTrigger>
        );
    }
}
