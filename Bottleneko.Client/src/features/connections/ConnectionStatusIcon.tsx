import { CSSProperties } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ConnectionStatus } from '../api/dtos.gen';

const parameters: Record<ConnectionStatus, { color: string; displayName: string }> = {
    [ConnectionStatus.NotConnected]: { color: '#aaa', displayName: 'Not Running' },
    [ConnectionStatus.Connecting]: { color: '#fb0', displayName: 'Connecting...' },
    [ConnectionStatus.Connected]: { color: '#0c0', displayName: 'Connected' },
    [ConnectionStatus.Reconnecting]: { color: '#fb0', displayName: 'Reconnecting...' },
    [ConnectionStatus.Stopping]: { color: '#fb0', displayName: 'Stopping...' },
    [ConnectionStatus.Error]: { color: '#f30', displayName: 'Error' },
};

export default function ConnectionStatusIcon({ status, showLabel = false, size = '1em', style = {}, props }: { status: ConnectionStatus; showLabel?: boolean; size?: string; style?: CSSProperties; props?: object }) {
    const styles = {
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-block',
        verticalAlign: 'middle',
        backgroundColor: parameters[status].color,
        marginTop: '-0.25em',
        ...style,
    };

    const renderTooltip = (props: object) => <Tooltip {...props}>{parameters[status].displayName}</Tooltip>;

    return (
        showLabel
            ? (
                    <span {...props}>
                        <span style={styles} />
                        {' '}
                        {parameters[status].displayName}
                    </span>
                )
            : (
                    <OverlayTrigger placement="bottom" overlay={renderTooltip}>
                        <span style={styles} />
                    </OverlayTrigger>
                )
    );
}
