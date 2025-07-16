import { useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { Alert } from 'react-bootstrap';
import View from '../../components/views/View';
import { LogSourceType, ScriptStatus } from '../api/dtos.gen';
import { useAsync, useFetchData } from '../../app/hooks';
import api from '../api';
import LogViewer from '../log/LogViewer';
import IconButton from '../../components/IconButton';
import TabView from '../../components/views/TabView';
import ScriptEditor from './ScriptEditor';

export default function ScriptView() {
    const { scriptId } = useParams();
    const fetchScript = useCallback((signal: AbortSignal) => api.scripts.get(scriptId ?? '', signal), [scriptId]);
    const [script, isRefreshing, refresh, notFound] = useFetchData(fetchScript, true);

    const canBeStarted = script && (script.status === ScriptStatus.Stopped || script.status === ScriptStatus.Error);
    const canBeRestarted = script && (script.status !== ScriptStatus.Stopped && script.status !== ScriptStatus.Stopping && script.status !== ScriptStatus.Error);
    const canBeStopped = script && (script.status !== ScriptStatus.Stopped && script.status !== ScriptStatus.Stopping && script.status !== ScriptStatus.Error);

    const [startScript, isStarting] = useAsync(useCallback(() => api.scripts.start(script?.id ?? '').then(refresh), [script, refresh]));
    const [restartScript, isRestarting] = useAsync(useCallback(() => api.scripts.restart(script?.id ?? '').then(refresh), [script, refresh]));
    const [stopScript, isStopping] = useAsync(useCallback(() => api.scripts.stop(script?.id ?? '').then(refresh), [script, refresh]));

    const isLoading = isRefreshing || isStarting || isRestarting || isStopping;

    const onSaved = useCallback(() => {
        refresh();
    }, [refresh]);

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
                    <IconButton icon="play-fill" tooltip="Start script" style={{ width: '2.75rem', height: '2.75rem' }} variant="success" disabled={!canBeStarted || isLoading} onClick={() => { void startScript(); }} />
                    <IconButton icon="arrow-clockwise" tooltip="Restart script" style={{ width: '2.75rem', height: '2.75rem' }} variant="warning" disabled={!canBeRestarted || isLoading} onClick={() => { void restartScript(); }} />
                    <IconButton icon="stop-circle" tooltip="Stop script" style={{ width: '2.75rem', height: '2.75rem' }} variant="danger" disabled={!canBeStopped || isLoading} onClick={() => { void stopScript(); }} />
                </div>
            )}
            defaultTab="logs"
            loading={!script}
        >
            <TabView.Tab id="logs" title="Logs" margin={false}>
                <LogViewer sourceType={LogSourceType.Script} sourceId={script?.id} />
            </TabView.Tab>

            <TabView.Tab id="settings" title="Edit">
                {
                    script
                        ? <ScriptEditor initialScript={script} onSaved={onSaved} />
                        : <></>
                }
            </TabView.Tab>
        </TabView>
    );
}
