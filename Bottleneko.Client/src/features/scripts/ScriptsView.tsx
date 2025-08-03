import View from '../../components/views/View';
import { useEntityDeletion } from '../../app/hooks';
import { ScriptEntityConfig, useScripts } from './context';
import ScriptList from './ScriptList';

export default function ScriptsView() {
    const scripts = useScripts();
    const { deleteEntity, dialog } = useEntityDeletion<ScriptEntityConfig>(scripts);

    return (
        <View title="Scripting" loading={!scripts?.state.list} fillScreen>
            {dialog}
            <ScriptList onDelete={(script) => { deleteEntity(script); }} />
        </View>
    );
}
