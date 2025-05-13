import { useState } from 'react';
import View from '../../../components/View';
import { ConnectionDefinition, protocols } from '..';
import { Protocol } from '../../api/dtos.gen';
import AddConnectionSelect from './AddConnectionSelect';
import AddConnectionConfig from './AddConnectionConfig';
import AddConnectionTest from './AddConnectionTest';
import AddConnectionFinish from './AddConnectionFinish';

export type AddConnectionStage = { stage: 'select' } | { stage: 'config'; definition: ConnectionDefinition | null } | { stage: 'test' | 'finish'; definition: ConnectionDefinition };

export default function AddConnectionView() {
    const [stage, setStage] = useState<AddConnectionStage>({ stage: 'select' });
    const [protocol, setProtocol] = useState<Protocol>(Protocol.Discord);

    let stageView = <div />;
    switch (stage.stage) {
        case 'select':
            stageView = <AddConnectionSelect protocol={protocol} setStage={setStage} onChanged={setProtocol} />;
            break;

        case 'config':
            stageView = <AddConnectionConfig protocol={protocol} definition={stage.definition} setStage={setStage} />;
            break;

        case 'test':
            stageView = <AddConnectionTest protocol={protocol} definition={stage.definition} setStage={setStage} />;
            break;

        case 'finish':
            stageView = <AddConnectionFinish protocol={protocol} definition={stage.definition} setStage={setStage} />;
            break;
    }

    return (
        <View title={stage.stage === 'select' ? 'Add new connection' : stage.stage === 'config' ? `Connect to ${protocols[protocol].name}` : stage.definition.name}>
            {stageView}
        </View>
    );
}
