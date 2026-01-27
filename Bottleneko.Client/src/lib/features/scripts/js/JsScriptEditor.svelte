<script lang="ts">
    import { Card, CardBody } from '@sveltestrap/sveltestrap';
    import { onDestroy, onMount } from 'svelte';
    import * as monaco from 'monaco-editor';
    import { bindings, type Props } from './JsScriptEditor';

    const props: Props = $props();

    let editorElement: HTMLElement | undefined = $state();
    let editor: monaco.editor.IStandaloneCodeEditor | null = $state(null);
    let subscription: monaco.IDisposable | null = $state(null);

    onMount(() => {
        monaco.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
        });

        monaco.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.typescript.ScriptTarget.ESNext,
            lib: ['esnext'],
            allowNonTsExtensions: true,
            module: monaco.typescript.ModuleKind.ESNext,
            moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
            typeRoots: ['file:///node_modules/@types'],
        });

        const libs: Parameters<typeof monaco.typescript.typescriptDefaults.setExtraLibs>[0] = [];

        for (const [name, content] of bindings) {
            libs.push({ filePath: `file:///node_modules/${name}`, content });
        }

        const packageJson = {
            dependencies: {
                neko: '*',
            },
        };
        libs.push({ content: JSON.stringify(packageJson), filePath: 'file:///package.json' });

        monaco.typescript.typescriptDefaults.setExtraLibs(libs);

        if (editorElement) {
            const path = monaco.Uri.parse('file:///script.ts');
            const model =
                monaco.editor.getModel(path) ?? monaco.editor.createModel(props.initialCode ?? '', 'typescript', path);
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
