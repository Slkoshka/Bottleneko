<script lang="ts">
    import IconButton from './IconButton.svelte';
    import * as clipboard from 'clipboard-polyfill';
    import { type Props } from './CopyableLabel';

    const props: Props = $props();

    const copy = () => {
        if (props.text !== undefined) {
            void clipboard.writeText(props.text);
        }
    };
</script>

<div style:display="grid" style:gap="0.5em" style:grid-template-columns="1fr 0fr" style:align-items="center">
    {@render props.children?.()}
    <IconButton
        icon="copy"
        tooltip="Copy to clipboard"
        style="width: 1.75em; height: 1.75em"
        variant="primary"
        onclick={copy}
    />
</div>
