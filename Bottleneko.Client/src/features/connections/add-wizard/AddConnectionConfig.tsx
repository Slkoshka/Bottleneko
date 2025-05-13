import { createElement, useRef } from 'react';
import { ConnectionDefinition, protocols } from '..';
import { Protocol } from '../../api/dtos.gen';
import { WizardNavigation } from '../../../components/WizardNavigation';
import { AddConnectionStage } from './AddConnectionView';

export default function AddConnectionConfig({ protocol, definition, setStage }: { protocol: Protocol; definition: ConnectionDefinition | null; setStage: (stage: AddConnectionStage) => void }) {
    const configFormRef = useRef<HTMLFormElement>(null);

    return (
        <>
            {createElement(protocols[protocol].configEditor, { definition, onValidated: (definition) => { setStage({ stage: 'test', definition }); }, ref: configFormRef })}
            <WizardNavigation back={() => { setStage({ stage: 'select' }); }} next={() => configFormRef.current?.requestSubmit()} />
        </>
    );
}
