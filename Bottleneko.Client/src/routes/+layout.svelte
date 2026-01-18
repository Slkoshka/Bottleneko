<script lang="ts" module>
    import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
    import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
    import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
    import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
    import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

    self.MonacoEnvironment = {
        getWorker(_, label) {
            if (label === 'json') {
                return new jsonWorker();
            }
            if (label === 'css' || label === 'scss' || label === 'less') {
                return new cssWorker();
            }
            if (label === 'html' || label === 'handlebars' || label === 'razor') {
                return new htmlWorker();
            }
            if (label === 'typescript' || label === 'javascript') {
                return new tsWorker();
            }
            return new editorWorker();
        },
    };
</script>

<script lang="ts">
    import 'svelte-highlight/styles/an-old-hope.css';
    import '../bootstrap.scss';
    import '../app.scss';
    import { authState, initAuth } from '$lib/features/auth.svelte';
    import LoadingPage from '$lib/pages/LoadingPage.svelte';
    import LoginPage from '$lib/pages/LoginPage.svelte';
    import ErrorPage from '../lib/pages/ErrorPage.svelte';
    import SidePanel from './SidePanel.svelte';
    import { brand } from '$lib/props';
    import { page } from '$app/state';
    import { onMount, type Snippet } from 'svelte';
    import Context from '$lib/components/Context.svelte';
    import { ConnectionsProvider } from '$lib/features/connections/provider.svelte';
    import { ProxiesProvider } from '$lib/features/proxies/provider.svelte';
    import { WebSocketConnection } from '$lib/features/ws/WebSocketConnection.svelte';
    import { ScriptsProvider } from '$lib/features/scripts/provider.svelte';
    import SetupPage from '$lib/pages/SetupPage.svelte';

    let { children }: { children: Snippet } = $props();

    onMount(initAuth);
</script>

<svelte:head>
    <title>{brand.plain}</title>
</svelte:head>

{#if page.status !== 200}
    {@render children()}
{:else if authState.data.status === 'loading'}
    <LoadingPage />
{:else if authState.data.status === 'logged-in'}
    <Context type={ConnectionsProvider} />
    <Context type={ProxiesProvider} />
    <Context type={ScriptsProvider} />
    <Context type={WebSocketConnection} />

    <div style:height="100dvh">
        <SidePanel />
        <main class="h-100">
            {@render children()}
        </main>
    </div>
{:else if authState.data.status === 'login-required'}
    <LoginPage />
{:else if authState.data.status === 'setup-required'}
    <SetupPage />
{:else if authState.data.status === 'error'}
    <ErrorPage />
{/if}
