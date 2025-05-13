import { Button, Card, Form, Table } from 'react-bootstrap';
import { useCallback } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { ScriptDto, ScriptStatus } from '../api/dtos.gen';
import { useAsync } from '../../app/hooks';
import api from '../api';
import IconButton from '../../components/IconButton';
import ScriptStatusIcon from './ScriptStatusIcon';
import { useScripts } from './context';

export default function ScriptInfoCard({ script, onDelete }: { script: ScriptDto; onDelete: () => void }) {
    const scripts = useScripts();

    const canBeStarted = script.status === ScriptStatus.Stopped || script.status === ScriptStatus.Error;
    const canBeRestarted = script.status !== ScriptStatus.Stopped && script.status !== ScriptStatus.Stopping && script.status !== ScriptStatus.Error;
    const canBeStopped = script.status !== ScriptStatus.Stopped && script.status !== ScriptStatus.Stopping && script.status !== ScriptStatus.Error;

    const [refresh, isRefreshing] = useAsync(useCallback(async () => {
        scripts?.actions.updated(await api.scripts.get(script.id));
    }, [script, scripts?.actions]));

    const [startScript, isStarting] = useAsync(useCallback(() => api.scripts.start(script.id).then(refresh), [script, refresh]));
    const [restartScript, isRestarting] = useAsync(useCallback(() => api.scripts.restart(script.id).then(refresh), [script, refresh]));
    const [stopScript, isStopping] = useAsync(useCallback(() => api.scripts.stop(script.id).then(refresh), [script, refresh]));

    const [toggleAutoStart, isUpdatingAutoStart] = useAsync(useCallback(() => api.scripts.update(script.id, { autoStart: !script.autoStart }).then(refresh), [script, refresh]));

    const isLoading = isRefreshing || isStarting || isRestarting || isStopping || isUpdatingAutoStart;

    return (
        <Card>
            <Card.Header style={{ display: 'grid', gap: '0.6em', gridTemplateColumns: '0fr 1fr 0fr' }}>
                <LinkContainer to={`/scripts/${script.id}`}>
                    <IconButton as="a" icon="gear-fill" tooltip="View script information and properties" />
                </LinkContainer>

                <div className="flex-grow-1 text-truncate">
                    <span className="fs-5"><strong>{script.name}</strong></span>
                </div>

                <Form>
                    <Form.Switch disabled={isLoading} style={{ fontSize: '1.25em', width: '10rem' }} checked={script.autoStart} onChange={() => { void toggleAutoStart(); }} label="Auto Start" reverse />
                </Form>
            </Card.Header>
            <Card.Body>
                <Table>
                    <tbody>
                        <tr>
                            <td className="w-100" colSpan={2}>
                                <span className="text-secondary">
                                    {
                                        script.description === ''
                                            ? <em>(no description)</em>
                                            : script.description
                                    }
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="w-50">Status</td>
                            <td className="w-50"><ScriptStatusIcon status={script.status} showLabel /></td>
                        </tr>
                    </tbody>
                </Table>
                <div style={{ gap: '0.5em', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 0fr' }}>
                    <Button variant="success" disabled={!canBeStarted || isLoading} onClick={() => { void startScript(); }}>
                        Start
                    </Button>
                    <Button variant="warning" disabled={!canBeRestarted || isLoading} onClick={() => { void restartScript(); }}>
                        Restart
                    </Button>
                    <Button variant="danger" disabled={!canBeStopped || isLoading} onClick={() => { void stopScript(); }}>
                        Stop
                    </Button>
                    <IconButton icon="trash3-fill" tooltip="Delete script" style={{ padding: '0.5em', height: '2.5em' }} variant="outline-danger" onClick={onDelete} />
                </div>
            </Card.Body>
        </Card>
    );
}
