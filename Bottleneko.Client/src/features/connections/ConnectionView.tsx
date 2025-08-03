import { createElement, useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button } from 'react-bootstrap';
import api from '../api';
import View from '../../components/views/View';
import LogViewer from '../log/LogViewer';
import { LogSourceType } from '../api/dtos.gen';
import { useEntityDeletion, useEntityEditor } from '../../app/hooks';
import { useToasterDispatch } from '../toaster/context';
import MessageHistoryViewer from '../messages/MessageHistoryViewer';
import TabView from '../../components/views/TabView';
import StateControlButtons from '../../components/StateControlButtons';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import ProtocolIcon from './ProtocolIcon';
import { ConnectionEntityConfig, useConnections } from './context';
import { ConnectionDefinition, protocols } from '.';

export default function ConnectionView() {
    const { connectionId: id } = useParams();
    const connections = useConnections();
    const navigate = useNavigate();
    const { deleteEntity, dialog } = useEntityDeletion<ConnectionEntityConfig>(connections, () => {
        navigate('/connections');
    });
    const { state, notFound, save, isSaving } = useEntityEditor<ConnectionEntityConfig>(id, api.connections, connections);

    const [savedDefinition, setSavedDefinition] = useState<ConnectionDefinition>();
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const editorFormRef = useRef<HTMLFormElement>(null);
    const toasterDispatch = useToasterDispatch();

    const onError = useCallback((err: unknown) => {
        toasterDispatch?.({ action: 'show', toast: { variant: 'danger', title: 'Failed to save', text: err instanceof Error ? err.message : 'Unknown error' } });
    }, [toasterDispatch]);

    let editor = <></>;
    if (state && !state.isLoading) {
        editor = createElement(protocols[state.data.protocol].configEditor, { definition: state.data, disabled: isSaving, onValidated: (definition) => {
            setSavedDefinition(definition);
            setShowSaveConfirmation(true);
        }, ref: editorFormRef });
    }

    if (notFound) {
        return (
            <View title="Not found">
                <Alert variant="warning" style={{ maxWidth: '600px' }}>
                    <span className="fs-5">The connection does not exist or has been deleted.</span>
                </Alert>
            </View>
        );
    }

    return (
        <TabView
            title={(
                <div className="d-flex" style={{ gap: '0.5rem' }}>
                    <span className="flex-grow-1">
                        <ProtocolIcon protocol={state?.data.protocol} />
                        {' '}
                        {state?.data.name}
                    </span>

                    <StateControlButtons
                        onStart={() => void state?.start()}
                        canStart={state?.canStart ?? false}
                        startTooltip="Connect"

                        onRestart={() => void state?.restart()}
                        canRestart={state?.canRestart ?? false}
                        restartTooltip="Reconnect"

                        onStop={() => void state?.stop()}
                        canStop={state?.canStop ?? false}
                        stopTooltip="Disconnect"

                        onDelete={() => { deleteEntity(state); }}
                        canDelete={!!state}
                    />
                </div>
            )}
            loading={!state}
            fillScreen
            defaultTab="messages"
        >
            <ConfirmationDialog
                title="Confirmation"
                show={showSaveConfirmation}
                onCancel={() => { setShowSaveConfirmation(false); }}
                onAccept={() => {
                    setShowSaveConfirmation(false);
                    if (savedDefinition) {
                        void save(savedDefinition).catch(onError);
                    }
                }}
                acceptText="Apply"
            >
                <p>Are you sure you want to apply new settings?</p>
                <p>This may cause the connection to be restarted, and it might miss messages or other events that have occured while it was reconnecting.</p>
            </ConfirmationDialog>

            {dialog}

            {id
                ? (
                        <TabView.Tab id="messages" title="Messages">
                            <MessageHistoryViewer className="h-100 fill" connectionId={id} />
                        </TabView.Tab>
                    )
                : <></>}

            <TabView.Tab id="logs" title="Logs">
                <LogViewer sourceType={LogSourceType.Connection} sourceId={id} />
            </TabView.Tab>

            <TabView.Tab id="edit" title="Settings">
                {editor}
                <hr />
                <div className="d-flex justify-content-center mx-auto pb-3">
                    <Button size="lg" className="mx-2" style={{ width: 'calc(max(25%, 10rem))' }} onClick={() => editorFormRef.current?.requestSubmit()} disabled={isSaving}>Apply</Button>
                </div>
            </TabView.Tab>
        </TabView>
    );
}
