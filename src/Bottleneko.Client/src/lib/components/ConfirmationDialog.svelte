<script lang="ts">
    import { Button } from '@sveltestrap/sveltestrap';
    import ModalDialog from './ModalDialog.svelte';
    import type { Props } from './ConfirmationDialog';

    let isAccepting = $state(false);

    const {
        loading = false,
        acceptText = 'Accept',
        cancelText = 'Cancel',
        acceptVariant = 'primary',
        title = 'Confirmation',
        ...props
    }: Props = $props();

    const doAccept = async () => {
        isAccepting = true;
        try {
            await props.onaccept?.();
        } finally {
            isAccepting = false;
        }
    };
</script>

<ModalDialog {title} show={props.show} onclose={props.onclose} size="lg" children={props.children}>
    {#snippet footer()}
        <Button
            onclick={loading || isAccepting ? undefined : props.onclose}
            color="secondary"
            disabled={loading || isAccepting}>{cancelText}</Button
        >
        <Button
            onclick={loading || isAccepting ? undefined : doAccept}
            color={acceptVariant}
            disabled={loading || isAccepting}>{acceptText}</Button
        >
    {/snippet}
</ModalDialog>
