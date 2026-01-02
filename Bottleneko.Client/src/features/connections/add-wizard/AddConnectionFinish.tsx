import { Alert } from 'react-bootstrap';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Highlight from 'react-highlight';
import { ConnectionDefinition } from '..';
import { useAsync, useOnceEffect } from '../../../app/hooks';
import { useConnections } from '../context';
import { WizardNavigation } from '../../../components/WizardNavigation';
import { ErrorMetadata, extractErrorInfo } from '../../../app/utils';
import { Protocol } from '../../api/dtos.gen';
import { AddConnectionStage } from './AddConnectionView';

export default function AddConnectionFinish({ definition, setStage }: { protocol: Protocol; definition: ConnectionDefinition; setStage: (stage: AddConnectionStage) => void }) {
    const [error, setError] = useState<ErrorMetadata | null>();
    const connections = useConnections();
    const navigate = useNavigate();

    const onError = useCallback((err: unknown) => {
        setError(extractErrorInfo(err));
    }, []);

    const [addConnection, isLoading] = useAsync(useCallback(async () => {
        if (!connections) {
            return;
        }

        const newConnection = (await connections.actions.add({ name: definition.name, config: definition.config })).result;
        await navigate(`/connections/${newConnection.id}`);
    }, [definition, connections, navigate]));

    useOnceEffect(() => {
        addConnection().catch(onError);
    });

    return (
        <>
            {
                isLoading
                    ? (
                            <Alert variant="primary">
                                <span className="fs-4">Adding new connection...</span>
                            </Alert>
                        )
                    : (
                            <Alert variant="danger">
                                <p className="fs-4">Failed to add connection</p>

                                <Highlight className="json">{JSON.stringify(error, null, 2)}</Highlight>
                            </Alert>
                        )
            }
            <WizardNavigation back={isLoading ? undefined : () => { setStage({ stage: 'config', definition }); }} />
        </>
    );
}
