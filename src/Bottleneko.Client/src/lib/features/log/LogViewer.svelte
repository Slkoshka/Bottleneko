<script lang="ts">
    import './styles.scss';
    import { type LogSeverity } from '$lib/api/bottleneko.gen';
    import { LogSubscriber } from '../ws/WebSocketConnection.svelte';
    import { Button, ButtonGroup, Card, CardBody, CardHeader } from '@sveltestrap/sveltestrap';
    import { getSeverityButtonVariant, messageStyle, severityStyle, type Props } from './LogViewer';
    import dateFormat from 'dateformat';
    import LogSourceDisplay from './LogSourceDisplay.svelte';
    import { blur } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import LoadingBanner from '$lib/components/LoadingBanner.svelte';

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

    const subscriber = new LogSubscriber();
    $effect(() => {
        subscriber.subscribe({
            severities: (Object.keys(severityFilter) as LogSeverity[]).filter((severity) => severityFilter[severity]),
            sourceType: props.sourceType ?? null,
            sourceId: props.sourceId ?? null,
            category: null,
        });
    });
</script>

<div class="h-100">
    <Card class="h-100" style="background-color: #141417">
        <CardHeader class="highlight d-flex flex-row align-items-center">
            <div style="flex-grow: 1">Log messages</div>
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
        </CardHeader>
        <CardBody style="overflow: hidden scroll">
            <div class="d-flex flex-column w-100 h-100">
                {#if subscriber.isLoading}
                    <LoadingBanner size="xl" />
                {:else if subscriber.mail.length === 0}
                    <div class="w-100 h-100 d-flex justify-content-center align-items-center">
                        <p class="text-secondary fst-italic" style="text-align: center">(no messages)</p>
                    </div>
                {:else}
                    {#each subscriber.mail as message (message.id)}
                        <div
                            class="font-monospace w-100 log-message"
                            style="line-height: 1.2em; padding: 0.2em"
                            in:blur|global={{ duration: 300 }}
                            animate:flip={{ duration: 300 }}
                        >
                            <span style="color: #707070"
                                >{dateFormat(new Date(message.timestamp), 'yyyy-mm-dd HH:MM:ss.l')}</span
                            >
                            {#if props.sourceType !== 'Connection' && props.sourceType !== 'Script'}
                                <div style="display: inline-block; width: 150px">
                                    <LogSourceDisplay sourceType={message.sourceType} sourceId={message.sourceId} />
                                </div>
                            {/if}
                            <span style="color: #707070">{message.category}</span>
                            <span style={severityStyle[message.severity]}>[{message.severity}]</span>
                            <span
                                style={`white-space: pre-wrap; word-break: break-all; ${messageStyle[message.severity]}`}
                                >{message.text}</span
                            >
                        </div>
                    {/each}
                {/if}
            </div>
        </CardBody>
    </Card>
</div>
