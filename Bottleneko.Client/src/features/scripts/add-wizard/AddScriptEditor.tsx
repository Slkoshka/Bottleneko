import { ScriptDto } from '../../api/dtos.gen';
import ScriptEditor, { EditedScript } from '../ScriptEditor';

export default function AddScriptEditor({ template, onSaved }: { template: EditedScript; onSaved: (script: ScriptDto) => void }) {
    return (
        <>
            <ScriptEditor script={template} onSaved={onSaved} />
        </>
    );
}
