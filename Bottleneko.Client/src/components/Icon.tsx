import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg';
import { CSSProperties } from 'react';

export default function Icon({ icon, style }: { icon: string; style?: CSSProperties }) {
    return (
        <svg className="bi" fill="currentColor" style={style}>
            <use xlinkHref={`${bootstrapIcons}#${icon}`} />
        </svg>
    );
}
