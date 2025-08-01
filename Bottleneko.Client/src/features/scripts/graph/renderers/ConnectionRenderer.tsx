import { CSSProperties } from 'react';
import { ClassicScheme, Presets } from 'rete-react-plugin';
import NekoConnection from '../connections/NekoConnection';

const { useConnection } = Presets.classic;

type ConnectionExtraData = { isPseudo: true } | NekoConnection;

interface Props<Scheme extends ClassicScheme> {
    data: Scheme['Connection'] & ConnectionExtraData;
    styles?: () => CSSProperties;
}

export function ConnectionRenderer<Scheme extends ClassicScheme>({ data, styles }: Props<Scheme>) {
    const { path } = useConnection();

    if (!path) {
        return null;
    }

    if (data.isPseudo) {
        return (
            <svg className="graph-connection graph-connection-pseudo" data-testid="conneciton">
                <path style={styles?.()} d={path} />
            </svg>
        );
    }
    else {
        return (
            <svg className={`graph-connection graph-type-${data.sourceType.id}`} data-testid="conneciton">
                <path style={styles?.()} d={path} />
            </svg>
        );
    };
}
