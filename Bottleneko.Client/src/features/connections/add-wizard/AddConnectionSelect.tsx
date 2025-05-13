import { Container, Row, ToggleButton } from 'react-bootstrap';
import ProtocolIcon from '../ProtocolIcon';
import { protocols } from '..';
import { Protocol } from '../../api/dtos.gen';
import { WizardNavigation } from '../../../components/WizardNavigation';
import { AddConnectionStage } from './AddConnectionView';

export default function AddConnectionSelect({ protocol, setStage, onChanged }: { protocol: Protocol; setStage: (stage: AddConnectionStage) => void; onChanged: (protocol: Protocol) => void }) {
    return (
        <>
            <Container>
                <Row md="1" lg="2" xl="3" xxl="4" className="align-items-stretch">
                    {
                        Object.values(Protocol).map(p => (
                            <div key={p} className="p-1" style={{ minHeight: '5em' }}>
                                <ToggleButton
                                    type="radio"
                                    className="w-100 h-100 fs-4 d-flex justify-content-center align-items-center"
                                    id={`protocol-${p}`}
                                    name="protocol"
                                    value={p}
                                    variant={protocol === p ? 'primary' : 'secondary'}
                                    checked={protocol === p}
                                    onChange={(e) => { onChanged(e.currentTarget.value as Protocol); }}
                                >

                                    <ProtocolIcon protocol={p} size="1.5em" className="mt-0" />
                                    <span className="px-2">{protocols[p].name}</span>
                                </ToggleButton>
                            </div>
                        ),
                        )
                    }
                </Row>
            </Container>
            <WizardNavigation next={() => { setStage({ stage: 'config', definition: null }); }} />
        </>
    );
}
