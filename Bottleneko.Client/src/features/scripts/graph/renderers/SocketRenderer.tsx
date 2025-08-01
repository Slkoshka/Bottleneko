import { CSSProperties } from 'react';
import { NekoSocket, OptionalInputSocket, OptionalSocket } from '../sockets';

interface Props {
    data: NekoSocket;
    styles?: () => CSSProperties;
}

export function SocketRenderer({ data, styles }: Props) {
    if (data instanceof OptionalSocket) {
        return <div className={`graph-node-socket graph-node-socket-optional graph-type-${data.type.innerType.$type}`} title={data.name} style={styles?.()} />;
    }
    else if (data instanceof OptionalInputSocket) {
        return <div className="graph-node-socket graph-node-socket-optional" title={data.name} style={styles?.()} />;
    }
    else {
        return <div className={`graph-node-socket graph-type-${data.type.$type}`} title={data.name} style={styles?.()} />;
    }
}
