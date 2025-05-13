import { Table } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import IconButton from '../../../components/IconButton';
import { EnvironmentInfoDto } from '../../api/dtos.gen';
import DashboardCard from './DashboardCard';

export default function MessagesDashboardCard({ systemInfo }: { systemInfo?: EnvironmentInfoDto }) {
    return (
        <DashboardCard title={(
            <div style={{ display: 'grid', gap: '0.6em', gridTemplateColumns: '1fr 0fr' }}>
                Messages

                <LinkContainer to="/messages/">
                    <IconButton as="a" icon="gear-fill" tooltip="View messages" />
                </LinkContainer>
            </div>
        )}
        >
            <Table>
                <tbody>
                    <tr>
                        <td className="w-50">Last Minute</td>
                        <td className="w-50">
                            {systemInfo?.messageStats.messagesInLastMinute}
                            {' '}
                            message(s)
                        </td>
                    </tr>
                    <tr>
                        <td className="w-50">Last Hour</td>
                        <td className="w-50">
                            {systemInfo?.messageStats.messagesInLastHour}
                            {' '}
                            message(s)
                        </td>
                    </tr>
                    <tr>
                        <td className="w-50">Last Day</td>
                        <td className="w-50">
                            {systemInfo?.messageStats.messagesInLastDay}
                            {' '}
                            message(s)
                        </td>
                    </tr>
                </tbody>
            </Table>
        </DashboardCard>
    );
}
