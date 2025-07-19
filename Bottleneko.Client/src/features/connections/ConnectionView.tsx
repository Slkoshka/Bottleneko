import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button } from 'react-bootstrap';
import api from '../api';
import View from '../../components/views/View';
import ModalDialog from '../../components/ModalDialog';
import LogViewer from '../log/LogViewer';
import { ConnectionStatus, LogSourceType } from '../api/dtos.gen';
import { useAsync } from '../../app/hooks';
import { useToasterDispatch } from '../toaster/context';
import MessageHistoryViewer from '../messages/MessageHistoryViewer';
import IconButton from '../../components/IconButton';
import TabView from '../../components/views/TabView';
import ProtocolIcon from './ProtocolIcon';
import { useConnections } from './context';
import { AnyConnectionDto, ConnectionDefinition, protocols } from '.';

export default function ConnectionView() {
    const { connectionId } = useParams();
    const fetchConnection = useCallback(() => api.connections.get(connectionId ?? ''), [connectionId]);
    const [savedDefinition, setSavedDefinition] = useState<ConnectionDefinition>();
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [connection, setConnection] = useState<AnyConnectionDto | null>(null);
    const [notFound, setNotFound] = useState(false);
    const connections = useConnections();
    const editorFormRef = useRef<HTMLFormElement>(null);
    const toasterDispatch = useToasterDispatch();

    const [startConnection, isStarting] = useAsync(useCallback(() => api.connections.start(connection?.id ?? '').then(fetchConnection).then(connection => connections?.actions.updated(connection)), [connection, connections?.actions, fetchConnection]));
    const [restartConnection, isRestarting] = useAsync(useCallback(() => api.connections.restart(connection?.id ?? '').then(fetchConnection).then(connection => connections?.actions.updated(connection)), [connection, connections?.actions, fetchConnection]));
    const [stopConnection, isStopping] = useAsync(useCallback(() => api.connections.stop(connection?.id ?? '').then(fetchConnection).then(connection => connections?.actions.updated(connection)), [connection, connections?.actions, fetchConnection]));

    const canBeStarted = connection && (connection.status === ConnectionStatus.NotConnected || connection.status === ConnectionStatus.Error);
    const canBeRestarted = connection && (connection.status !== ConnectionStatus.NotConnected && connection.status !== ConnectionStatus.Stopping && connection.status !== ConnectionStatus.Error);
    const canBeStopped = connection && (connection.status !== ConnectionStatus.NotConnected && connection.status !== ConnectionStatus.Stopping && connection.status !== ConnectionStatus.Error);

    const isLoading = !connections || isStarting || isRestarting || isStopping;

    const onError = useCallback((err: unknown) => {
        toasterDispatch?.({ action: 'show', toast: { variant: 'danger', title: 'Failed to save', text: err instanceof Error ? err.message : 'Unknown error' } });
    }, [toasterDispatch]);

    useEffect(() => {
        if (connections?.state.list) {
            const newConnection = connections.state.list.find(c => c.id === connectionId) ?? null;
            setConnection(newConnection);
            setNotFound(!newConnection);
        }
    }, [connections?.state.list, connectionId]);

    const [save, isSaving] = useAsync(useCallback(async (formData: ConnectionDefinition) => {
        if (!connection) {
            return;
        }

        const newConnection = await api.connections.update(connection.id, formData);
        connections?.actions.updated(newConnection.connection);
    }, [connection, connections?.actions]));

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
                    <IconButton icon="play-fill" tooltip="Connect" style={{ width: '2.75rem', height: '2.75rem' }} variant="success" disabled={!canBeStarted || isLoading} onClick={() => { void startConnection(); }} />
                    <IconButton icon="arrow-clockwise" tooltip="Reconnect" style={{ width: '2.75rem', height: '2.75rem' }} variant="warning" disabled={!canBeRestarted || isLoading} onClick={() => { void restartConnection(); }} />
                    <IconButton icon="stop-circle" tooltip="Disconnect" style={{ width: '2.75rem', height: '2.75rem' }} variant="danger" disabled={!canBeStopped || isLoading} onClick={() => { void stopConnection(); }} />
                </div>
            )}
            loading={!connection}
            defaultTab="messages"
        >
            <ModalDialog
                header="Confirmation"
                show={showSaveConfirmation}
                onCancel={() => { setShowSaveConfirmation(false); }}
                buttons={[
                    { key: 'cancel', text: 'Cancel', onClick: () => { setShowSaveConfirmation(false); }, props: { variant: 'secondary' } },
                    { key: 'apply', text: 'Apply', onClick: () => {
                        setShowSaveConfirmation(false);
                        if (savedDefinition) {
                            void save(savedDefinition).catch(onError);
                        }
                    }, props: { variant: 'primary' } },
                ]}
            >
                <p>Are you sure you want to apply new settings?</p>
                <p>This may cause the connection to be restarted, and it might miss messages or other events that have occured while it was reconnecting.</p>
            </ModalDialog>

            {connectionId
                ? (
                        <TabView.Tab id="messages" title="Messages" margin={false}>
                            <MessageHistoryViewer className="h-100" connectionId={connectionId} />
                        </TabView.Tab>
                    )
                : <></>}

            <TabView.Tab id="logs" title="Logs" margin={false}>
                <LogViewer sourceType={LogSourceType.Connection} sourceId={connectionId} />
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
