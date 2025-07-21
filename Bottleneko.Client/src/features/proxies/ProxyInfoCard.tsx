import { Table } from 'react-bootstrap';
import { ProxyDto } from '../api/dtos.gen';
import IconButton from '../../components/IconButton';
import InfoCard from '../../components/info-card/InfoCard';
import { proxyTypeMap } from '.';

export default function ProxyInfoCard({ proxy, onEdit, onDelete }: { proxy: ProxyDto; onEdit: () => void; onDelete: () => void }) {
    return (
        <InfoCard title={proxy.name}>
            <InfoCard.HeaderExtra position="start">
                <IconButton as="a" icon="gear-fill" tooltip="Edit proxy settings" onClick={onEdit} />
            </InfoCard.HeaderExtra>

            <InfoCard.HeaderExtra position="end">
                <IconButton as="a" variant="danger" icon="trash3-fill" tooltip="Delete proxy" onClick={onDelete} />
            </InfoCard.HeaderExtra>

            <Table>
                <tbody>
                    <tr>
                        <td className="w-50">Type</td>
                        <td className="w-50">{proxyTypeMap[proxy.type].name}</td>
                    </tr>
                    <tr>
                        <td className="w-50">Address</td>
                        <td className="w-50 font-monospace">
                            {proxy.hostname}
                            :
                            {proxy.port}
                        </td>
                    </tr>
                </tbody>
            </Table>
        </InfoCard>
    );
}
