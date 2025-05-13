import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useCallback, useState } from 'react';
import View from '../../components/View';
import { useAsync } from '../../app/hooks';
import api from '../api';
import { ScriptDto } from '../api/dtos.gen';
import DeleteConfirmationDialog from '../../components/DeleteConfirmationDialog';
import ScriptInfoCard from './ScriptInfoCard';
import { useScripts } from './context';

export default function ScriptsView() {
    const scripts = useScripts();
    const [deletingScript, setDeletingScript] = useState<ScriptDto | undefined>(undefined);

    const [deleteScript] = useAsync(useCallback(async () => {
        if (deletingScript) {
            try {
                await api.scripts.delete(deletingScript.id);
                scripts?.actions.deleted(deletingScript.id);
            }
            finally {
                setDeletingScript(undefined);
            }
        }
    }, [deletingScript, scripts?.actions]));

    const getScriptInfo = (script: ScriptDto) => {
        return {
            id: {
                name: 'ID',
                value: script.id,
            },
            name: {
                name: 'Name',
                value: script.name,
            },
            description: {
                name: 'Description',
                value: deletingScript?.description === '' ? <em>(no description)</em> : deletingScript?.description,
            },
        };
    };

    return (
        <View title="Scripting" loading={!scripts?.state.list}>
            <DeleteConfirmationDialog
                item={deletingScript}
                itemTypeName="script"
                onDelete={() => { void deleteScript(); }}
                onCancel={() => { setDeletingScript(undefined); }}
                itemInfoBuilder={getScriptInfo}
            />

            <div className="d-flex flex-column" style={{ gap: '10px', width: 'calc(min(100%, 600px))', maxWidth: '600px' }}>
                <LinkContainer to="/scripts/add"><Button size="lg" variant="primary">Add Script</Button></LinkContainer>

                {scripts?.state.list?.map(script => <ScriptInfoCard key={script.id} script={script} onDelete={() => { setDeletingScript(script); }} />)}
            </div>
        </View>
    );
}
