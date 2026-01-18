<script lang="ts">
    import { Card, CardBody } from '@sveltestrap/sveltestrap';
    import { onDestroy, onMount } from 'svelte';
    import typeDefs from '$lib/scriptApi/typeDefs';
    import * as monaco from 'monaco-editor';
    import type { Props } from './JsScriptEditor';

    const props: Props = $props();

    let editorElement: HTMLElement | undefined = $state();
    let editor: monaco.editor.IStandaloneCodeEditor | null = $state(null);
    let subscription: monaco.IDisposable | null = $state(null);

    onMount(() => {
        monaco.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: false,
        });

        monaco.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.typescript.ScriptTarget.Latest,
            lib: ['esnext'],
            allowNonTsExtensions: true,
            module: monaco.typescript.ModuleKind.ESNext,
            moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
            typeRoots: ['file:///node_modules/@types'],
        });

        const fixName = (path: string, name: string) => {
            name = name.substring(0, name.length - '.d.ts'.length);
            if (name === 'index') {
                return path;
            } else if (name.endsWith('/index')) {
                return path + '/' + name.substring(0, name.length - '/index'.length);
            } else {
                return path + '/' + name;
            }
        };

        const libs: Parameters<typeof monaco.typescript.javascriptDefaults.setExtraLibs>[0] = [];

        for (const typeDef of typeDefs) {
            if (typeDef.path === 'bottleneko.gen.d.ts') {
                libs.push({ content: typeDef.src });
            } else {
                const packageName = fixName('neko', typeDef.path);
                const src = `declare module '${packageName}' {\n${typeDef.src}\n}\n`;
                libs.push({ content: src, filePath: 'file:///node_modules/@types/neko/' + typeDef.path });
            }
        }

        const packages = typeDefs
            .filter((typeDef) => typeDef.path !== 'bottleneko.gen.d.ts')
            .map((typeDef) => fixName('neko', typeDef.path))
            .map((name) => `    "${name}": "*"`)
            .join(',\n');
        const packageJson = `{\n  "dependencies": {\n${packages}\n  }\n}`;
        libs.push({ content: packageJson, filePath: 'file:///package.json' });

        monaco.typescript.javascriptDefaults.setExtraLibs(libs);

        if (editorElement) {
            const path = monaco.Uri.parse('file:///script.js');
            const model =
                monaco.editor.getModel(path) ?? monaco.editor.createModel(props.initialCode ?? '', 'javascript', path);
            model.setValue(props.initialCode ?? '');

            editor = monaco.editor.create(editorElement, {
                model,
                theme: 'vs-dark',
                minimap: { enabled: false },
                scrollbar: { vertical: 'visible', horizontal: 'auto' },
            });
            subscription = editor.onDidChangeModelContent(() => {
                const code = editor?.getValue();
                if (code !== undefined) {
                    props.onchange?.({ $type: 'JavaScript', source: code });
                }
            });
        }
    });
    onDestroy(() => {
        subscription?.dispose();
        subscription = null;
        editor?.dispose();
        editor = null;
    });
</script>

<Card class="flex-grow-1">
    <CardBody style="min-height: 20rem">
        <section style="display: flex; position: relative; text-align: initial; width: 100%; height: 100%;">
            <div style="width: 100%" bind:this={editorElement}></div>
        </section>
    </CardBody>
</Card>
