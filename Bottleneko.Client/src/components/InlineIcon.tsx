import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg';
import { CSSProperties } from 'react';

export default function InlineIcon({ icon, size = '1em', style = {}, className = '' }: { icon: string; size?: CSSProperties['width']; style?: CSSProperties; className?: string }) {
    const styles = {
        width: size,
        height: size,
        ...style,
    };

    return (
        <svg className={`bi ${className}`} style={{ marginTop: '-0.25em', display: 'inline', ...styles }} fill="currentColor">
            <use xlinkHref={`${bootstrapIcons}#${icon}`} />
        </svg>
    );
};
