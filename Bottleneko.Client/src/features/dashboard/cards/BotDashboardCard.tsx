import { OverlayTrigger, Table, Tooltip } from 'react-bootstrap';
import { useCallback, useEffect, useState } from 'react';
import * as clipboard from 'clipboard-polyfill';
import LoadingBanner from '../../../components/LoadingBanner';
import { formatDuration } from '../../../app/utils';
import { useInterval } from '../../../app/hooks';
import { EnvironmentInfoDto } from '../../api/dtos.gen';
import { branding } from '../../../props';
import IconButton from '../../../components/IconButton';
import DashboardCard from './DashboardCard';

export default function BotDashboardCard({ systemInfo }: { systemInfo?: EnvironmentInfoDto }) {
    const [updateInfoTime, setUpdateInfoTime] = useState(0);
    const [botUptime, setBotUptime] = useState('');

    useEffect(() => {
        setUpdateInfoTime(Date.now());
    }, [systemInfo]);

    const updateTimers = useCallback(() => {
        if (systemInfo) {
            setBotUptime(formatDuration(systemInfo.neko.uptime + (Date.now() - updateInfoTime) / 1000));
        }
    }, [systemInfo, updateInfoTime]);

    useEffect(updateTimers, [updateTimers]);
    useInterval(updateTimers, 500);

    const renderTooltip = useCallback((props: object) => (
        <Tooltip {...props}>
            {systemInfo?.neko.version}
        </Tooltip>
    ), [systemInfo]);

    return (
        <DashboardCard title={branding.plain} className="dashboard-card-bot">
            <Table>
                <tbody>
                    <tr>
                        <td>Version</td>
                        <td>
                            {
                                systemInfo
                                    ? (
                                            <div style={{ display: 'grid', gap: '0.5em', gridTemplateColumns: '1fr 0fr' }}>
                                                <OverlayTrigger placement="bottom" overlay={renderTooltip}>
                                                    <span className="text-collapse">{systemInfo.neko.version}</span>
                                                </OverlayTrigger>
                                                <IconButton icon="copy" tooltip="Copy to clipboard" style={{ width: '1.75em', height: '1.75em' }} onClick={() => void clipboard.writeText(systemInfo.neko.version)} />
                                            </div>
                                        )
                                    : <LoadingBanner />
                            }
                        </td>
                    </tr>
                    <tr>
                        <td>Uptime</td>
                        <td>{ systemInfo ? <>{botUptime}</> : <LoadingBanner />}</td>
                    </tr>
                    <tr>
                        <td>.NET Version</td>
                        <td>{ systemInfo ? <>{systemInfo.system.dotNetVersion}</> : <LoadingBanner />}</td>
                    </tr>
                </tbody>
            </Table>
        </DashboardCard>
    );
}
