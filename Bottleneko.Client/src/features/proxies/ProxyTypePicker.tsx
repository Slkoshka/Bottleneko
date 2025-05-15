import { Form } from 'react-bootstrap';
import { ProxyType } from '../api/dtos.gen';
import { proxyTypes } from '.';

export default function ProxyTypePicker({ type, onChange }: { type: ProxyType; onChange: (type: ProxyType) => void }) {
    return (
        <>
            {
                proxyTypes.map(proxyType => (
                    <Form.Group key={proxyType.type}>
                        <Form.Check
                            type="radio"
                            label={proxyType.name}
                            checked={proxyType.type === type}
                            onChange={() => { onChange(proxyType.type); }}
                        />
                        <Form.Text muted>
                            {proxyType.description}
                        </Form.Text>
                    </Form.Group>
                ))
            }
        </>
    );
}
