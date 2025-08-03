import { CSSProperties } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ScriptStatus } from '../api/dtos.gen';

const parameters: Record<ScriptStatus, { color: string; displayName: string }> = {
    [ScriptStatus.Stopped]: { color: '#aaa', displayName: 'Not Running' },
    [ScriptStatus.Starting]: { color: '#fb0', displayName: 'Starting...' },
    [ScriptStatus.Running]: { color: '#0c0', displayName: 'Running' },
    [ScriptStatus.Restarting]: { color: '#fb0', displayName: 'Restarting...' },
    [ScriptStatus.Stopping]: { color: '#fb0', displayName: 'Stopping...' },
    [ScriptStatus.Error]: { color: '#f30', displayName: 'Error' },
};

export default function ScriptStatusIcon({ status, showLabel = false, size = '1em', style = {}, props }: { status: ScriptStatus; showLabel?: boolean; size?: string; style?: CSSProperties; props?: object }) {
    const styles = {
        width: size,
        height: size,
        backgroundColor: parameters[status].color,
        ...style,
    };

    const renderTooltip = (props: object) => <Tooltip {...props}>{parameters[status].displayName}</Tooltip>;

    return (
        showLabel
            ? (
                    <span {...props}>
                        <span className="status-icon" style={styles} />
                        {' '}
                        {parameters[status].displayName}
                    </span>
                )
            : (
                    <OverlayTrigger placement="bottom" overlay={renderTooltip}>
                        <span className="status-icon" style={styles} />
                    </OverlayTrigger>
                )
    );
}
