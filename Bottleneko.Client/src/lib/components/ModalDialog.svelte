<script lang="ts">
    import { Modal, ModalBody, ModalFooter, ModalHeader } from '@sveltestrap/sveltestrap';
    import type { Props } from './ModalDialog';

    const props: Props = $props();
</script>

<Modal
    isOpen={props.show}
    onclose={props.onclose}
    toggle={props.onclose}
    centered
    keyboard
    autoFocus
    backdrop
    fade
    size={props.size ?? 'md'}
>
    <ModalHeader>
        {#if typeof props.title === 'string'}
            {props.title ?? 'Dialog'}
        {:else}
            {@render props.title?.()}
        {/if}
    </ModalHeader>

    <ModalBody>
        {@render props.children?.()}
    </ModalBody>

    {#if props.footer}
        <ModalFooter>
            {#if typeof props.footer === 'string'}
                {props.footer}
            {:else}
                {@render props.footer()}
            {/if}
        </ModalFooter>
    {/if}
</Modal>
