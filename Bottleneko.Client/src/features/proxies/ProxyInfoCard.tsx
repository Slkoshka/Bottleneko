import { Card, Table } from 'react-bootstrap';
import { ProxyDto } from '../api/dtos.gen';
import IconButton from '../../components/IconButton';
import { proxyTypeMap } from '.';

export default function ProxyInfoCard({ proxy, onEdit, onDelete }: { proxy: ProxyDto; onEdit: () => void; onDelete: () => void }) {
    return (
        <Card>
            <Card.Header style={{ display: 'grid', gap: '0.6em', gridTemplateColumns: '0fr 1fr 0fr' }}>
                <IconButton as="a" icon="gear-fill" tooltip="Edit proxy settings" onClick={onEdit} />

                <div className="flex-grow-1 text-truncate">
                    <span className="fs-5">
                        <strong>{proxy.name}</strong>
                    </span>
                </div>

                <IconButton as="a" variant="danger" icon="trash3-fill" tooltip="Delete proxy" onClick={onDelete} />
            </Card.Header>
            <Card.Body>
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
            </Card.Body>
        </Card>
    );
}
