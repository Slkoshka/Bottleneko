import { Editor, OnMount, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useRef } from 'react';
import { Card } from 'react-bootstrap';
import { ScriptCode } from '../api/dtos.gen';
import typeDefs from './api/typeDefs';

export default function JsScriptEditor({ initialCode, onChange, props, className }: { initialCode?: string; onChange: (code: ScriptCode) => void; props?: object; className?: string }) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const onEditorWillMount = (monaco: Monaco) => {
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: false,
        });

        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            lib: ['esnext'],
            allowNonTsExtensions: true,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            typeRoots: ['file:///node_modules/@types'],
        });

        const fixName = (path: string, name: string) => {
            name = name.substring(0, name.length - '.d.ts'.length);
            if (name === 'index') {
                return path;
            }
            else if (name.endsWith('/index')) {
                return path + '/' + name.substring(0, name.length - '/index'.length);
            }
            else {
                return path + '/' + name;
            }
        };

        const libs: Parameters<typeof monaco.languages.typescript.javascriptDefaults.setExtraLibs>[0] = [];

        for (const typeDef of typeDefs) {
            if (typeDef.path === 'bottleneko.gen.d.ts') {
                libs.push({ content: typeDef.src });
            }
            else {
                const packageName = fixName('neko', typeDef.path);
                const src = `declare module '${packageName}' {\n${typeDef.src}\n}\n`;
                libs.push({ content: src, filePath: 'file:///node_modules/@types/neko/' + typeDef.path });
            }
        }

        const packages = typeDefs
            .filter(typeDef => typeDef.path !== 'bottleneko.gen.d.ts')
            .map(typeDef => fixName('neko', typeDef.path))
            .map(name => `    "${name}": "*"`)
            .join(',\n');
        const packageJson = `{\n  "dependencies": {\n${packages}\n  }\n}`;
        libs.push({ content: packageJson, filePath: 'file:///package.json' });

        monaco.languages.typescript.javascriptDefaults.setExtraLibs(libs);
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
                    defaultPath="file:///script.js"
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
