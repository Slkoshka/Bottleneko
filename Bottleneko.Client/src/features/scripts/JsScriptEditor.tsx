import { Editor, OnMount, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useRef } from 'react';
import { Card } from 'react-bootstrap';
import { ScriptCode } from '../api/dtos.gen';
import scriptGen from './script.gen.d?raw';
import scriptApi from './script.api.d?raw';

export default function JsScriptEditor({ initialCode, onChange, props, className }: { initialCode?: string; onChange: (code: ScriptCode) => void; props?: object; className?: string }) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const onEditorWillMount = (monaco: Monaco) => {
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            lib: ['esnext'],
            allowNonTsExtensions: true,
        });

        monaco.languages.typescript.javascriptDefaults.addExtraLib(scriptGen);
        monaco.languages.typescript.javascriptDefaults.addExtraLib(scriptApi);
    };

    const onEditorMount: OnMount = (editor) => {
        editorRef.current = editor;
    };

    return (
        <Card className="flex-grow-1">
            <Card.Body style={{ minHeight: '20rem' }}>
                <Editor
                    defaultLanguage="javascript"
                    defaultValue={initialCode}
                    onMount={onEditorMount}
                    beforeMount={onEditorWillMount}
                    onChange={(code) => { onChange({ $type: 'JavaScript', source: code ?? '' }); }}
                    className={className ?? ''}
                    theme="vs-dark"
                    options={{ minimap: { enabled: false }, scrollbar: { vertical: 'visible', horizontal: 'auto' } }}
                    {...props}
                />
            </Card.Body>
        </Card>
    );
}
