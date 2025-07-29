import { CSSProperties } from 'react';
import { ClassicScheme, Presets } from 'rete-react-plugin';

const { useConnection } = Presets.classic;

type ConnectionExtraData = { isPseudo: true } | { isPseudo: false; isLoop?: boolean; sourceType: string; innerSourceType?: string; targetType: string; innerTargetType?: string };

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
            <svg className={`graph-connection graph-type-${data.innerSourceType ?? data.sourceType}`} data-testid="conneciton">
                <path style={styles?.()} d={path} />
            </svg>
        );
    };
}
