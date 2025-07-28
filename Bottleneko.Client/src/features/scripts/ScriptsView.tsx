import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useCallback, useState } from 'react';
import View from '../../components/views/View';
import { useAsync } from '../../app/hooks';
import api from '../api';
import { ScriptDto } from '../api/dtos.gen';
import DeleteConfirmationDialog from '../../components/DeleteConfirmationDialog';
import InfoCardList from '../../components/info-card/InfoCardList';
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

            <InfoCardList>
                <LinkContainer to="/scripts/add"><Button size="lg" variant="primary">Create Script</Button></LinkContainer>

                {scripts?.state.list?.map(script => <ScriptInfoCard key={script.id} script={script} onDelete={() => { setDeletingScript(script); }} />)}
            </InfoCardList>
        </View>
    );
}
