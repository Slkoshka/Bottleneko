import { createElement, useCallback, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button } from 'react-bootstrap';
import api from '../api';
import View from '../../components/views/View';
import LogViewer from '../log/LogViewer';
import { ConnectionStatus, LogSourceType } from '../api/dtos.gen';
import { useAsync, useEntityEditor } from '../../app/hooks';
import { useToasterDispatch } from '../toaster/context';
import MessageHistoryViewer from '../messages/MessageHistoryViewer';
import TabView from '../../components/views/TabView';
import StateControlButtons from '../../components/StateControlButtons';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import ProtocolIcon from './ProtocolIcon';
import { useConnections } from './context';
import { AnyConnectionDto, ConnectionDefinition, protocols } from '.';

export default function ConnectionView() {
    const { connectionId: id } = useParams();
    const connections = useConnections();
    const [connection, fetch, notFound, save, isSaving] = useEntityEditor<AnyConnectionDto, ConnectionDefinition>(id, api.connections, connections);

    const [savedDefinition, setSavedDefinition] = useState<ConnectionDefinition>();
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const editorFormRef = useRef<HTMLFormElement>(null);
    const toasterDispatch = useToasterDispatch();

    const doAction = useCallback((action: (id: string) => Promise<void>) => action(id ?? '').then(fetch).then(connection => connections?.actions.updated(connection)), [id, connections?.actions, fetch]);

    const [start, isStarting] = useAsync(() => doAction(api.connections.start));
    const [restart, isRestarting] = useAsync(() => doAction(api.connections.restart));
    const [stop, isStopping] = useAsync(() => doAction(api.connections.stop));

    const canBeStarted = !!connection && (connection.status === ConnectionStatus.NotConnected || connection.status === ConnectionStatus.Error);
    const canBeRestarted = !!connection && (connection.status !== ConnectionStatus.NotConnected && connection.status !== ConnectionStatus.Stopping && connection.status !== ConnectionStatus.Error);
    const canBeStopped = !!connection && (connection.status !== ConnectionStatus.NotConnected && connection.status !== ConnectionStatus.Stopping && connection.status !== ConnectionStatus.Error);

    const isLoading = !connections || isStarting || isRestarting || isStopping;

    const onError = useCallback((err: unknown) => {
        toasterDispatch?.({ action: 'show', toast: { variant: 'danger', title: 'Failed to save', text: err instanceof Error ? err.message : 'Unknown error' } });
    }, [toasterDispatch]);

    let editor = <></>;
    if (!isLoading && connection) {
        editor = createElement(protocols[connection.protocol].configEditor, { definition: connection, disabled: isSaving, onValidated: (definition) => {
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
                        <ProtocolIcon protocol={connection?.protocol} />
                        {' '}
                        {connection?.name}
                    </span>

                    <StateControlButtons
                        onStart={() => void start()}
                        canStart={canBeStarted && !isLoading}
                        startTooltip="Connect"

                        onRestart={() => void restart()}
                        canRestart={canBeRestarted && !isLoading}
                        restartTooltip="Reconnect"

                        onStop={() => void stop()}
                        canStop={canBeStopped && !isLoading}
                        stopTooltip="Disconnect"
                    />
                </div>
            )}
            loading={!connection}
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

            {id
                ? (
                        <TabView.Tab id="messages" title="Messages" margin={false}>
                            <MessageHistoryViewer className="h-100 fill" connectionId={id} />
                        </TabView.Tab>
                    )
                : <></>}

            <TabView.Tab id="logs" title="Logs" margin={false}>
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
