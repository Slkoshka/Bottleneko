import { Alert } from 'react-bootstrap';
import { useCallback, useState } from 'react';
import Highlight from 'react-highlight';
import { ConnectionDefinition } from '..';
import api from '../../api';
import { useAsync, useOnce } from '../../../app/hooks';
import { WizardNavigation } from '../../../components/WizardNavigation';
import { ErrorMetadata, extractErrorInfo } from '../../../app/utils';
import { Protocol } from '../../api/dtos.gen';
import { AddConnectionStage } from './AddConnectionView';

export default function AddConnectionTest({ protocol, definition, setStage }: { protocol: Protocol; definition: ConnectionDefinition; setStage: (stage: AddConnectionStage) => void }) {
    const [extra, setExtra] = useState<object | null>();
    const [error, setError] = useState<ErrorMetadata | null>();

    const onError = useCallback((err: unknown) => {
        setError(extractErrorInfo(err));
    }, []);

    const [testConfig, isLoading] = useAsync(useCallback(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setExtra((await api.connections.test<any>(protocol, definition.config)).extra);
    }, [definition.config, protocol]));

    useOnce(() => {
        void testConfig().catch(onError);
    });

    return (
        <>
            {
                isLoading
                    ? (
                            <Alert variant="primary">
                                <span className="fs-4">Testing configuration...</span>
                            </Alert>
                        )
                    : <></>
            }
            {
                !isLoading && error
                    ? (
                            <Alert variant="danger">
                                <p className="fs-4">Configuration test failed</p>

                                <Highlight className="json">{JSON.stringify(error, null, 2)}</Highlight>
                            </Alert>
                        )
                    : <></>
            }
            {
                !isLoading && !error
                    ? (
                            <Alert variant="success">
                                <span className="fs-4">Success! The configuration appears to be valid.</span>
                                {
                                    extra
                                        ? (
                                                <>
                                                    <p>Here&apos;s some additional information that might be helpful to you:</p>
                                                    <Highlight className="json">{JSON.stringify(extra, null, 2)}</Highlight>
                                                </>
                                            )
                                        : <></>
                                }
                            </Alert>
                        )
                    : <></>
            }

            <WizardNavigation
                back={isLoading
                    ? undefined
                    : () => { setStage({ stage: 'config', definition }); }}
                next={!isLoading && !error
                    ? () => { setStage({ stage: 'finish', definition }); }
                    : undefined}
            />
        </>
    );
}
