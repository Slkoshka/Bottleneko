<script lang="ts" generics="T extends LocalEntity<RemoteEntityData, never, never>">
    import { Table } from '@sveltestrap/sveltestrap';
    import ConfirmationDialog from './ConfirmationDialog.svelte';
    import { LocalEntity, type RemoteEntityData } from '$lib/provider.svelte';
    import type { Props } from './EntityDeletionDialog';

    const props: Props<T> = $props();
</script>

<ConfirmationDialog
    show={!!props.item}
    loading={props.loading}
    acceptText="Delete"
    onclose={props.onclose}
    onaccept={props.ondelete}
    acceptVariant="danger"
>
    <p>
        Are you sure you want to delete the following {props['type-name'] ?? 'object'}?
    </p>
    {#if props.item}
        <Table striped responsive>
            <tbody>
                {#each Object.keys(props.item.info) as property (property)}
                    <tr>
                        <td>{props.item.info[property].name}</td>
                        <td class="font-monospace">{props.item.info[property].value}</td>
                    </tr>
                {/each}
            </tbody>
        </Table>
    {/if}
</ConfirmationDialog>
