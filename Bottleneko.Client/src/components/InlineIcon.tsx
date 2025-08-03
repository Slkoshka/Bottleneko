import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg';
import { CSSProperties, ReactNode } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

export default function InlineIcon({ icon, tooltip, size = '1em', style = {}, className = '' }: { icon: string; tooltip?: () => ReactNode; size?: CSSProperties['width']; style?: CSSProperties; className?: string }) {
    const styles = {
        width: size,
        height: size,
        ...style,
    };

    const content = (
        <svg className={`bi ${className}`} style={{ marginTop: '-0.25em', display: 'inline', ...styles }} fill="currentColor">
            <use xlinkHref={`${bootstrapIcons}#${icon}`} />
        </svg>
    );

    if (tooltip) {
        return (
            <OverlayTrigger placement="bottom" overlay={props => <Tooltip {...props}>{tooltip()}</Tooltip>}>
                {content}
            </OverlayTrigger>
        );
    }
    else {
        return content;
    }
};
