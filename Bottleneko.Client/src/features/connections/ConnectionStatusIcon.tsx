import { CSSProperties, ReactNode, useCallback, useEffect, useState } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ConnectionStatus, ExtendedConnectionStatus } from '../api/dtos.gen';
import { useInterval } from '../../app/hooks';

interface StatusIconParameters {
    color: string;
    displayName: ReactNode;
}

const parameters: Record<ConnectionStatus, StatusIconParameters | ((status: ExtendedConnectionStatus) => StatusIconParameters)> = {
    [ConnectionStatus.NotConnected]: { color: '#aaa', displayName: 'Not Running' },
    [ConnectionStatus.Connecting]: { color: '#fb0', displayName: 'Connecting...' },
    [ConnectionStatus.Connected]: { color: '#0c0', displayName: 'Connected' },
    [ConnectionStatus.Reconnecting]: { color: '#fb0', displayName: 'Reconnecting...' },
    [ConnectionStatus.DelayedReconnect]: (status: ExtendedConnectionStatus) => ({ color: '#fb0', displayName:
        status.statusChangeDelay <= 0
            ? 'Reconnecting...'
            : (
                    <>
                        Reconnecting in
                        {' '}
                        {Math.ceil(Math.max(0, status.statusChangeDelay))}
                        <>&nbsp;</>
                        second
                        {Math.ceil(status.statusChangeDelay) !== 1 ? 's' : ''}
                        ...
                    </>
                ) }),
    [ConnectionStatus.Stopping]: { color: '#fb0', displayName: 'Stopping...' },
    [ConnectionStatus.Error]: { color: '#f30', displayName: 'Error' },
};

const getParameters = (status: ExtendedConnectionStatus) => {
    const params = parameters[status.status];
    if (typeof params === 'function') {
        return params(status);
    }
    else {
        return params;
    }
};

export default function ConnectionStatusIcon({ status, showLabel = false, size = '1em', style = {}, props }: { status: ExtendedConnectionStatus; showLabel?: boolean; size?: string; style?: CSSProperties; props?: object }) {
    const [currentStatus, setCurrentStatus] = useState(status);
    const [params, setParams] = useState(getParameters(currentStatus));

    useInterval(useCallback(() => {
        const newStatus = { ...currentStatus, statusChangeDelay: currentStatus.statusChangeDelay - 0.5 };
        setCurrentStatus(newStatus);
    }, [currentStatus]), 500);

    useEffect(() => {
        setCurrentStatus(status);
    }, [status]);

    useEffect(() => {
        setParams(getParameters(currentStatus));
    }, [currentStatus]);

    const styles = {
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-block',
        verticalAlign: 'middle',
        backgroundColor: params.color,
        marginTop: '-0.25em',
        ...style,
    };

    const renderTooltip = (props: object) => <Tooltip {...props}>{params.displayName}</Tooltip>;

    return (
        showLabel
            ? (
                    <span {...props}>
                        <span style={styles} />
                        {' '}
                        {params.displayName}
                    </span>
                )
            : (
                    <OverlayTrigger placement="bottom" overlay={renderTooltip}>
                        <span style={styles} />
                    </OverlayTrigger>
                )
    );
}
