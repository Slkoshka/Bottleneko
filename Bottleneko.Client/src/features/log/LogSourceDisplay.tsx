import { Link } from 'react-router-dom';
import { LogSourceType } from '../api/dtos.gen';
import { useConnections } from '../connections/context';
import { useScripts } from '../scripts/context';
import ProtocolIcon from '../connections/ProtocolIcon';

export default function LogSourceDisplay({ sourceType, sourceId }: { sourceType: LogSourceType; sourceId: string }) {
    const connections = useConnections();
    const scripts = useScripts();

    switch (sourceType) {
        case LogSourceType.System:
            return (
                <Link to="/system" className="btn btn-primary btn-sm px-1 py-0">
                    System
                </Link>
            );

        case LogSourceType.Connection:
            return (
                <Link to={`/connections/${sourceId}`} className="btn btn-success btn-sm px-1 py-0">
                    <ProtocolIcon protocol={connections?.state.list?.find(connection => connection.id === sourceId)?.protocol} />
                    {' '}
                    {connections?.state.list?.find(connection => connection.id === sourceId)?.name ?? `Connection #${sourceId}`}
                </Link>
            );

        case LogSourceType.Script:
            return (
                <Link to={`/scripts/${sourceId}`} className="btn btn-warning btn-sm px-1 py-0">
                    {scripts?.state.list?.find(script => script.id === sourceId)?.name ?? `Script #${sourceId}`}
                </Link>
            );

        default:
            return <></>;
    }
}
