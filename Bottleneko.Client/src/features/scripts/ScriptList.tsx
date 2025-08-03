import './scripts.scss';
import { useCallback } from 'react';
import { Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import ScrollableTable from '../../components/table/ScrollableTable';
import StateControlButtons from '../../components/StateControlButtons';
import IconButton from '../../components/IconButton';
import { TableRow } from '../../components/table';
import { useScripts } from './context';
import ScriptStatusIcon from './ScriptStatusIcon';
import { ScriptState } from './ScriptsProvider';

export default function ScriptList({ onDelete }: { onDelete: (script: ScriptState) => void }) {
    const scripts = useScripts();
    const navigate = useNavigate();

    const columns = [
        { id: 'name', header: 'Script Name', width: '10em' },
        { id: 'description', header: 'Description', className: 'text-collapse' },
        { id: 'status', header: 'Status', style: { width: '10em' } },
        { id: 'autostart', header: 'Auto Start', className: 'text-collapse', style: { width: '7em' } },
        { id: 'actions', header: '', style: { width: '8em' } },
    ];

    const renderRow = useCallback((script: ScriptState): TableRow => ({
        id: script.data.id,
        onClick: () => { navigate(`/scripts/${script.data.id}`); },
        columns: {
            name: {
                content: script.data.name,
                className: 'text-collapse',
                style: { verticalAlign: 'middle', width: '10em' },
            },
            description: {
                content: (
                    script.data.description === ''
                        ? <em className="text-secondary">(no description)</em>
                        : (
                                <OverlayTrigger
                                    placement="bottom"
                                    overlay={(props: object) => (
                                        <Tooltip className="script-description-tooltip" {...props}>
                                            {script.data.description}
                                        </Tooltip>
                                    )}
                                >
                                    <div className="text-collapse">{script.data.description}</div>
                                </OverlayTrigger>
                            )
                ),
                className: 'text-collapse',
                style: { verticalAlign: 'middle', maxWidth: '0' },
            },
            status: {
                content: <ScriptStatusIcon status={script.data.status} showLabel />,
                style: { verticalAlign: 'middle' },
            },
            autostart: {
                content: <Form.Switch style={{ fontSize: '1.25em' }} checked={script.data.autoStart} disabled={script.isLoading} onChange={() => { void script.setAutoStart(!script.data.autoStart); }} />,
                onClick: (e) => { e.stopPropagation(); },
            },
            actions: {
                content: (
                    <div className="w-100">
                        <StateControlButtons
                            canStart={script.canStart}
                            onStart={() => { void script.start(); }}

                            canRestart={script.canRestart}
                            onRestart={() => { void script.restart(); }}

                            canStop={script.canStop}
                            onStop={() => { void script.stop(); }}

                            canDelete={true}
                            onDelete={() => { onDelete(script); }}

                            size="2em"
                        />
                    </div>
                ),
                onClick: (e) => { e.stopPropagation(); },
            },
        },
    }), [navigate, onDelete]);

    return (
        <div className="h-100" style={{ padding: '0.5em' }}>
            <ScrollableTable<ScriptState>
                columns={columns}
                render={renderRow}
                data={scripts?.state.list}
                placeholder={() => <em className="text-secondary fst-italic">(no scripts)</em>}
                title="Script list"
                className="entity-list"
                style={{ minWidth: '47em' }}
                highlightHeader
            >
                <ScrollableTable.HeaderExtra position="end">
                    <LinkContainer to="/scripts/add">
                        <IconButton icon="plus-lg" tooltip="Add script" variant="dark" />
                    </LinkContainer>
                </ScrollableTable.HeaderExtra>
            </ScrollableTable>
        </div>
    );
}
