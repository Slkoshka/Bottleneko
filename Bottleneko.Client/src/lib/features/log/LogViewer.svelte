<script lang="ts">
    import './styles.scss';
    import { type LogSeverity, type LogLetter } from '$lib/api/bottleneko.gen';
    import type { TypedRendererProps, TypedDataTable } from '$lib/components/DataTable';
    import DataTable from '$lib/components/DataTable.svelte';
    import { Subscriber } from '../ws/WebSocketConnection.svelte';
    import LogRowRenderer from './LogRowRenderer.svelte';
    import { Button, ButtonGroup } from '@sveltestrap/sveltestrap';
    import { getSeverityButtonVariant, type Props, type TableType } from './LogViewer';

    const props: Props = $props();

    let severityFilter: Record<LogSeverity, boolean> = $state({
        Critical: true,
        Error: true,
        Warning: true,
        Info: true,
        Verbose: false,
        Debug: false,
    });

    const toggleSeverityFilter = (severity: LogSeverity) => {
        severityFilter = { ...severityFilter, [severity]: !severityFilter[severity] };
    };

    const subscriber = new Subscriber<LogLetter>();
    $effect(() => {
        subscriber.subscribe({
            topic: {
                $type: 'Logs',
                filter: {
                    severities: (Object.keys(severityFilter) as LogSeverity[]).filter(
                        (severity) => severityFilter[severity],
                    ),
                    sourceType: props.sourceType ?? null,
                    sourceId: props.sourceId ?? null,
                    category: null,
                },
            },
        });
    });

    const columns = $derived({
        timestamp: { header: 'Timestamp' },
        source: props.sourceType !== 'Connection' && props.sourceType !== 'Script' ? { header: 'Source' } : undefined,
        category: { header: 'Category' },
        message: { header: 'Message' },
    });

    const LogViewerTable = DataTable as TypedDataTable<TableType>;
    const rendererProps: TypedRendererProps<TableType> = (props) => {
        return props;
    };
</script>

<div class="h-100">
    <LogViewerTable
        title="Log messages"
        class={props.class}
        highlight-header
        renderer={LogRowRenderer}
        {rendererProps}
        {columns}
        rows={subscriber.isLoading
            ? undefined
            : subscriber.mail.map((message) => ({
                  id: message.id,
                  class: `log-message log-message-${message.severity.toLowerCase()} font-monospace`,
                  cells: {
                      timestamp: {
                          class: 'log-message-timestamp',
                      },
                      source: {
                          class: 'log-message-source',
                      },
                      category: {
                          class: 'log-message-category',
                      },
                      message: {
                          class: 'log-message-text',
                      },
                  },
                  data: message,
              }))}
    >
        {#snippet placeholder()}
            <em class="text-secondary fst-italic">(no messages)</em>
        {/snippet}

        {#snippet endHeaderExtra()}
            <ButtonGroup style="max-width: 1000px">
                {#each Object.keys(severityFilter) as LogSeverity[] as severity (severity)}
                    <Button
                        color={getSeverityButtonVariant(severity, severityFilter[severity])}
                        class={severityFilter[severity] ? '' : 'text-white'}
                        onclick={() => {
                            toggleSeverityFilter(severity);
                        }}
                        size="sm"
                    >
                        {severity}
                    </Button>
                {/each}
            </ButtonGroup>
        {/snippet}
    </LogViewerTable>
</div>
