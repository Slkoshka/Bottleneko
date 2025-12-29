import { Accordion } from 'react-bootstrap';
import { ReactNode } from 'react';
import InfoCard from '../../../components/info-card/InfoCard';
import IconButton from '../../../components/IconButton';
import { ScriptCode } from '../../api/dtos.gen';
import templates from '../templates';
import { AddScriptStage } from './AddScriptView';

export default function AddScriptTemplate({ setStage }: { setStage: (stage: AddScriptStage) => void }) {
    const renderTemplate = (id: string, template: { name: string; description: ReactNode; code: ScriptCode }) => {
        return (
            <InfoCard key={id} title={template.name} highlightHeader>
                <InfoCard.HeaderExtra position="end">
                    <IconButton icon="plus-lg" tooltip="Select template" size="sm" variant="dark" onClick={() => { setStage({ stage: 'editor', template: { name: template.name, description: '', code: template.code } }); }} />
                </InfoCard.HeaderExtra>

                {template.description === '' ? <em className="text-secondary fst-italic">No description</em> : template.description}
            </InfoCard>
        );
    };

    return (
        <Accordion defaultActiveKey="js">
            {/* <Accordion.Item eventKey="graph">
                <Accordion.Header>
                    <span className="fs-5">Graph templates</span>
                </Accordion.Header>
                <Accordion.Body>
                    <div className="d-flex flex-column" style={{ gap: '10px', width: 'calc(min(100%, 600px))', maxWidth: '600px' }}>
                        {
                            Object.entries(templates.graph).map(([id, template]) => renderTemplate(id, template))
                        }
                    </div>
                </Accordion.Body>
            </Accordion.Item> */}

            <Accordion.Item eventKey="js">
                <Accordion.Header>
                    <span className="fs-5">JavaScript templates</span>
                </Accordion.Header>
                <Accordion.Body>
                    <div className="d-flex flex-column" style={{ gap: '10px', width: 'calc(min(100%, 600px))', maxWidth: '600px' }}>
                        {
                            Object.entries(templates.javaScript).map(([id, template]) => renderTemplate(id, template))
                        }
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
}
