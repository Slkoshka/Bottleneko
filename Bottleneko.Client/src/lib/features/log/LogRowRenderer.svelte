<script lang="ts">
    import dateFormat from 'dateformat';
    import LogSourceDisplay from './LogSourceDisplay.svelte';
    import type { Props } from './LogRowRenderer';

    const props: Props = $props();
</script>

{#if props.column === 'timestamp'}
    {dateFormat(new Date(props.row.timestamp), 'yyyy-mm-dd HH:MM:ss')}
{:else if props.column === 'source'}
    <LogSourceDisplay sourceType={props.row.sourceType} sourceId={props.row.sourceId} />
{:else if props.column === 'category'}
    {props.row.category}
{:else if props.column === 'message'}
    {props.row.text}
{/if}
