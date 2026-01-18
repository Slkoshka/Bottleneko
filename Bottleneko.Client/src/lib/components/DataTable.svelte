<script
    lang="ts"
    generics="T, Columns extends Record<string, TableColumn | undefined>, RendererProps extends RowRendererProps<T, Columns>"
>
    import { Card, CardBody, CardHeader, Table } from '@sveltestrap/sveltestrap';
    import LoadingBanner from './LoadingBanner.svelte';
    import { type Props, type RowRendererProps, type TableColumn } from './DataTable';

    const props: Props<T, Columns, RendererProps> = $props();
</script>

<Card
    class={`scrollable-table-card h-100 ${props.class ?? ''} ${props.variant ?? ''} ${props.variant === 'entity-list' ? 'small-page-content' : ''}`}
>
    {#if props.title}
        <CardHeader
            class={`info-card-header ${props['highlight-header'] === true ? 'highlight' : ''}`}
            style="display: grid; grid-template-columns: 0fr 1fr 0fr;"
        >
            <div style:padding-right={props.startHeaderExtra ? '0.6em' : '0'}>{@render props.startHeaderExtra?.()}</div>
            <div class="flex-grow-1 text-truncate">
                <span class="fs-5">
                    {#if typeof props.title === 'string'}
                        {props.title}
                    {:else}
                        {@render props.title()}
                    {/if}
                </span>
            </div>
            <div style:padding-left={props.endHeaderExtra ? '0.6em' : '0'}>{@render props.endHeaderExtra?.()}</div>
        </CardHeader>
    {/if}

    <CardBody class="d-flex flex-column h-100" style="overflow-y: hidden">
        <div class="flex-grow-1" style="overflow-y: scroll">
            <Table
                size="sm"
                class={`scrollable-table sticky-header mb-0 ${!props.rows || props.rows.length === 0 ? 'h-100' : ''}`}
            >
                <thead style:height="1em">
                    <tr>
                        {#each Object.entries(props.columns) as [id, column] (id)}
                            {#if column}
                                <th class={column.class} style={column.style}>
                                    {#if typeof column.header === 'string'}
                                        {column.header}
                                    {:else}
                                        {@render column.header()}
                                    {/if}
                                </th>
                            {/if}
                        {/each}
                    </tr>
                </thead>
                <tbody>
                    {#if !props.rows}
                        <tr>
                            <td colSpan={Object.keys(props.columns).length}>
                                <LoadingBanner size="xl" />
                            </td>
                        </tr>
                    {:else if props.rows.length == 0}
                        <tr class="table-placeholder">
                            <td colSpan={Object.keys(props.columns).length} class="text-center align-middle">
                                {#if typeof props.placeholder === 'string'}
                                    {props.placeholder}
                                {:else}
                                    {@render props.placeholder?.()}
                                {/if}
                            </td>
                        </tr>
                    {:else}
                        {#each props.rows as row (row.id)}
                            <tr class={row.class} style={row.style} onclick={row.onclick}>
                                {#each Object.keys(props.columns).filter((column) => props.columns[column] !== undefined) as column (column)}
                                    {#if column in row.cells}
                                        <td
                                            class={row.cells[column].class}
                                            style={row.cells[column].style}
                                            onclick={row.cells[column].onclick}
                                        >
                                            <props.renderer {...props.rendererProps({ row: row.data, column })} />
                                        </td>
                                    {:else}
                                        <td></td>
                                    {/if}
                                {/each}
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </Table>
        </div>
    </CardBody>
</Card>

<style lang="scss">
    :global(.scrollable-table-card.entity-list),
    :global(.scrollable-table-card.small-table) {
        max-width: 800px;
        width: 100%;

        :global(tr:not(.table-placeholder)) {
            cursor: pointer;

            &:hover :global(td) {
                background-color: #333;
            }
        }
    }
</style>
