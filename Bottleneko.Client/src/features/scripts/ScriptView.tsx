import { useNavigate, useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { Alert } from 'react-bootstrap';
import View from '../../components/views/View';
import { LogSourceType } from '../api/dtos.gen';
import { useEntityDeletion, useEntityEditor } from '../../app/hooks';
import api from '../api';
import LogViewer from '../log/LogViewer';
import TabView from '../../components/views/TabView';
import StateControlButtons from '../../components/StateControlButtons';
import ScriptEditor from './ScriptEditor';
import { ScriptEntityConfig, useScripts } from './context';

export default function ScriptView() {
    const { scriptId: id } = useParams();
    const scripts = useScripts();
    const navigate = useNavigate();
    const { deleteEntity, dialog } = useEntityDeletion<ScriptEntityConfig>(scripts, () => {
        void navigate('/scripts');
    });
    const { state, fetch, notFound } = useEntityEditor<ScriptEntityConfig>(id, api.scripts, scripts);

    const onSaved = useCallback(() => {
        void fetch().then(script => scripts?.actions.updated(script));
    }, [fetch, scripts?.actions]);

    if (notFound) {
        return (
            <View title="Not found">
                <Alert variant="warning" style={{ maxWidth: '600px' }}>
                    <span className="fs-5">The script does not exist or has been deleted.</span>
                </Alert>
            </View>
        );
    }

    return (
        <TabView
            title={(
                <div className="d-flex" style={{ gap: '0.5rem' }}>
                    <span className="flex-grow-1">
                        {state?.data.name}
                    </span>

                    <StateControlButtons
                        onStart={() => void state?.start()}
                        canStart={state?.canStart ?? false}
                        startTooltip="Start script"

                        onRestart={() => void state?.restart()}
                        canRestart={state?.canRestart ?? false}
                        restartTooltip="Restart script"

                        onStop={() => void state?.stop()}
                        canStop={state?.canStop ?? false}
                        stopTooltip="Stop script"

                        onDelete={() => { deleteEntity(state); }}
                        canDelete={!!state}
                    />
                </div>
            )}
            defaultTab="logs"
            loading={!state}
            fillScreen
        >
            {dialog}

            <TabView.Tab id="logs" title="Logs">
                <LogViewer sourceType={LogSourceType.Script} sourceId={state?.data.id} />
            </TabView.Tab>

            <TabView.Tab id="settings" title="Properties">
                {
                    state
                        ? <ScriptEditor id={state.data.id} script={state.data} onSaved={onSaved} />
                        : <></>
                }
            </TabView.Tab>
        </TabView>
    );
}
