import { OverlayTrigger, Table, Tooltip } from 'react-bootstrap';
import { useCallback, useEffect, useState } from 'react';
import dateFormat from 'dateformat';
import LoadingBanner from '../../../components/LoadingBanner';
import { formatDuration } from '../../../app/utils';
import { EnvironmentInfoDto } from '../../api/dtos.gen';
import { useInterval } from '../../../app/hooks';
import CopyableLabel from '../../../components/CopyableLabel';
import DashboardCard from './DashboardCard';

export default function SystemDashboardCard({ systemInfo }: { systemInfo?: EnvironmentInfoDto }) {
    const [updateInfoTime, setUpdateInfoTime] = useState(0);
    const [systemUptime, setSystemUptime] = useState('');
    const [serverTime, setServerTime] = useState<Date>(new Date());

    useEffect(() => {
        setUpdateInfoTime(Date.now());
    }, [systemInfo]);

    const updateTimers = useCallback(() => {
        if (systemInfo) {
            setSystemUptime(formatDuration(systemInfo.system.uptime + (Date.now() - updateInfoTime) / 1000));
            setServerTime(new Date(new Date(systemInfo.system.currentTime).getTime() + (Date.now() - updateInfoTime)));
        }
    }, [systemInfo, updateInfoTime]);
    useInterval(updateTimers, 500);
    useEffect(updateTimers, [updateTimers]);

    const systemVersion = systemInfo ? `${systemInfo.system.operatingSystem} (${systemInfo.system.arch})` : '';
    const renderTooltip = useCallback((props: object) => (
        <Tooltip {...props}>
            {systemVersion}
        </Tooltip>
    ), [systemVersion]);

    return (
        <DashboardCard title="System" className="dashboard-card-system">
            <Table>
                <tbody>
                    <tr>
                        <td>Hostname</td>
                        <td>{ systemInfo ? <>{systemInfo.system.hostname}</> : <LoadingBanner />}</td>
                    </tr>
                    <tr>
                        <td>OS</td>
                        <td>
                            { systemInfo
                                ? (
                                        <CopyableLabel text={systemVersion}>
                                            <OverlayTrigger placement="bottom" overlay={renderTooltip}>
                                                <span className="text-collapse">{systemVersion}</span>
                                            </OverlayTrigger>
                                        </CopyableLabel>
                                    )
                                : <LoadingBanner />}
                        </td>
                    </tr>
                    <tr>
                        <td>Uptime</td>
                        <td>{ systemInfo ? <>{systemUptime}</> : <LoadingBanner />}</td>
                    </tr>
                    <tr>
                        <td>Server Time</td>
                        <td>{ systemInfo ? <>{dateFormat(serverTime, 'yyyy-mm-dd HH:MM:ss')}</> : <LoadingBanner />}</td>
                    </tr>
                </tbody>
            </Table>
        </DashboardCard>
    );
}
