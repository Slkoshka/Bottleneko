import { CSSProperties } from 'react';
import { Protocol } from '../api/dtos.gen';
import InlineIcon from '../../components/InlineIcon';
import { protocols } from '.';

export default function ProtocolIcon({ protocol = null, size, style, className }: { protocol?: Protocol | null; size?: CSSProperties['width']; style?: CSSProperties; className?: string }) {
    if (!protocol) {
        return <></>;
    }

    return (
        <InlineIcon icon={protocols[protocol].icon ?? 'wifi'} tooltip={() => protocols[protocol].name} className={className} size={size} style={{ ...style }} />
    );
}
