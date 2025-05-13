import { useParams } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import View from '../../components/View';
import { LogSourceType, ScriptStatus } from '../api/dtos.gen';
import { useAsync, useFetchData } from '../../app/hooks';
import api from '../api';
import LogViewer from '../log/LogViewer';
import IconButton from '../../components/IconButton';
import ScriptEditor from './ScriptEditor';

export default function ScriptView() {
    const { scriptId } = useParams();
    const fetchScript = useCallback((signal: AbortSignal) => api.scripts.get(scriptId ?? '', signal), [scriptId]);
    const [script, isRefreshing, refresh] = useFetchData(fetchScript, true);
    const [activeTab, setActiveTab] = useState<string | undefined | null>();

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

    return (
        <View
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
            loading={!script}
        >
            <Tabs defaultActiveKey="logs" activeKey={activeTab ?? undefined} onSelect={(tab) => { setActiveTab(tab); }}>
                <Tab eventKey="logs" title="Logs" className="h-100">
                    <LogViewer sourceType={LogSourceType.Script} sourceId={script?.id} />
                </Tab>

                <Tab eventKey="settings" title="Edit" className="h-100 m-3">
                    {
                        script
                            ? <ScriptEditor initialScript={script} onSaved={onSaved} />
                            : <></>
                    }
                </Tab>
            </Tabs>
        </View>
    );
}
