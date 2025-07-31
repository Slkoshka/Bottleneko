import './add-script.scss';
import { useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
import View from '../../../components/views/View';
import { ScriptDto } from '../../api/dtos.gen';
import { EditedScript } from '../ScriptEditor';
import AddScriptTemplate from './AddScriptTemplate';
import AddScriptEditor from './AddScriptEditor';

export type AddScriptStage = { stage: 'template' } | { stage: 'editor'; template: EditedScript };

export default function AddScriptView() {
    const [stage, setStage] = useState<AddScriptStage>({ stage: 'template' });

    const navigate = useNavigate();

    const onSaved = useCallback((script: ScriptDto) => {
        navigate(`/scripts/${script.id}`);
    }, [navigate]);

    let stageView = <></>;
    switch (stage.stage) {
        case 'template':
            stageView = <AddScriptTemplate setStage={setStage} />;
            break;

        case 'editor':
            stageView = <AddScriptEditor template={stage.template} onSaved={onSaved} />;
            break;
    }

    return (
        <View title="Create a new script" fillScreen>
            {stageView}
        </View>
    );
}
