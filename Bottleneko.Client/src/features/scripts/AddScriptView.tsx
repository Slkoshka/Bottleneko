import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import View from '../../components/View';
import { ScriptDto } from '../api/dtos.gen';
import ScriptEditor from './ScriptEditor';

export default function AddScriptView() {
    const navigate = useNavigate();
    const onSaved = useCallback((script: ScriptDto) => {
        navigate(`/scripts/${script.id}`);
    }, [navigate]);

    return (
        <View title="Script Editor">
            <ScriptEditor onSaved={onSaved} />
        </View>
    );
}
