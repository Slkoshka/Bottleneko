<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { resolved } from '$lib';
    import WizardNavigation from '$lib/components/WizardNavigation.svelte';
    import { protocols, type ConnectionConfigEditor } from '$lib/features/connections';
    import type { Props } from './AddConnectionConfig';

    const props: Props = $props();
    const Editor = $derived(protocols[props.protocol].editor);
    let editor: ConnectionConfigEditor | null = $state(null);
</script>

<div>
    <Editor
        definition={props.definition}
        bind:this={editor}
        onsubmit={(definition) => {
            props.onstagechange?.({ id: 'test', protocol: props.protocol, definition });
            return resolved(undefined);
        }}
    />
    <WizardNavigation
        back={() => {
            void goto(resolve('/connections/add'));
        }}
        next={editor?.submit}
    />
</div>
