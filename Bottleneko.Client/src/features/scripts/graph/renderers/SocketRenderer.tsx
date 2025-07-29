import { CSSProperties } from 'react';
import { NekoSocket, OptionalInputSocket, OptionalSocket } from '../sockets';

interface Props {
    data: NekoSocket;
    styles?: () => CSSProperties;
}

export function SocketRenderer({ data, styles }: Props) {
    if (data instanceof OptionalSocket) {
        return <div className={`graph-socket graph-socket-optional graph-type-${(new data.innerType() as NekoSocket).type}`} title={data.name} style={styles?.()} />;
    }
    else if (data instanceof OptionalInputSocket) {
        return <div className="graph-socket graph-socket-optional" title={data.name} style={styles?.()} />;
    }
    else {
        return <div className={`graph-socket graph-type-${data.type}`} title={data.name} style={styles?.()} />;
    }
}
