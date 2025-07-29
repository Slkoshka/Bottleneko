import { useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { Alert } from 'react-bootstrap';
import View from '../../components/views/View';
import { LogSourceType, ScriptDto, ScriptStatus } from '../api/dtos.gen';
import { useAsync, useEntityEditor } from '../../app/hooks';
import api from '../api';
import LogViewer from '../log/LogViewer';
import TabView from '../../components/views/TabView';
import StateControlButtons from '../../components/StateControlButtons';
import ScriptEditor from './ScriptEditor';
import { useScripts } from './context';

export default function ScriptView() {
    const { scriptId: id } = useParams();
    const scripts = useScripts();
    const [script, fetch, notFound] = useEntityEditor<ScriptDto>(id, api.scripts, scripts);

    const doAction = useCallback((action: (id: string) => Promise<void>) => action(id ?? '').then(fetch).then(script => scripts?.actions.updated(script)), [id, scripts?.actions, fetch]);

    const [start, isStarting] = useAsync(() => doAction(api.scripts.start));
    const [restart, isRestarting] = useAsync(() => doAction(api.scripts.restart));
    const [stop, isStopping] = useAsync(() => doAction(api.scripts.stop));

    const canBeStarted = !!script && (script.status === ScriptStatus.Stopped || script.status === ScriptStatus.Error);
    const canBeRestarted = !!script && (script.status !== ScriptStatus.Stopped && script.status !== ScriptStatus.Stopping && script.status !== ScriptStatus.Error);
    const canBeStopped = !!script && (script.status !== ScriptStatus.Stopped && script.status !== ScriptStatus.Stopping && script.status !== ScriptStatus.Error);

    const isLoading = !scripts || isStarting || isRestarting || isStopping;

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
                        {script?.name}
                    </span>

                    <StateControlButtons
                        onStart={() => void start()}
                        canStart={canBeStarted && !isLoading}
                        startTooltip="Start script"

                        onRestart={() => void restart()}
                        canRestart={canBeRestarted && !isLoading}
                        restartTooltip="Restart script"

                        onStop={() => void stop()}
                        canStop={canBeStopped && !isLoading}
                        stopTooltip="Stop script"
                    />
                </div>
            )}
            defaultTab="logs"
            loading={!script}
            fillScreen
        >
            <TabView.Tab id="logs" title="Logs" margin={false}>
                <LogViewer sourceType={LogSourceType.Script} sourceId={script?.id} />
            </TabView.Tab>

            <TabView.Tab id="settings" title="Edit">
                {
                    script
                        ? <ScriptEditor id={script.id} script={script} onSaved={onSaved} />
                        : <></>
                }
            </TabView.Tab>
        </TabView>
    );
}
