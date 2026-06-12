<script lang="ts">
    import { ChangesTracker, filterInPlace, type ArrayElement } from '$lib';
    import { onDestroy, onMount } from 'svelte';
    import type { Props } from './Chart';
    import { Chart } from 'chart.js';
    import './Chart';

    const props: Props = $props();

    let chart: Chart | null = $state(null);
    let chartCanvas: HTMLCanvasElement | undefined = $state();

    onMount(() => {
        const ctx = chartCanvas?.getContext('2d');
        if (ctx) {
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: props.labels,
                    datasets: props.values,
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        colors: {
                            enabled: true,
                        },
                        tooltip: {
                            enabled: true,
                        },
                    },
                },
            });
        }
    });
    onDestroy(() => {
        chart?.destroy();
    });

    // svelte-ignore state_referenced_locally
    const labelsChangesTracker = new ChangesTracker<Props['labels']>((_, labels) => {
        if (chart) {
            chart.data.labels = labels;
            chart.update('none');
        }
    }, props.labels);
    $effect(() => {
        labelsChangesTracker.set(props.labels);
    });

    // svelte-ignore state_referenced_locally
    const valuesChangesTracker = new ChangesTracker<Props['values']>((_, values) => {
        if (chart) {
            /* eslint-disable svelte/prefer-svelte-reactivity */
            const toRemove = new Set<ArrayElement<(typeof chart)['data']['datasets']>>();
            /* eslint-disable svelte/prefer-svelte-reactivity */
            const datasetsById = new Map<string, { label: string; data: number[] }>();

            for (let i = 0; i < chart.data.datasets.length; i++) {
                const dataset = chart.data.datasets[i] as {
                    id: undefined | string;
                    label: string | undefined;
                    data: number[];
                };
                if (dataset.id !== undefined && dataset.label !== undefined) {
                    datasetsById.set(dataset.id, dataset as { id: string; label: string; data: number[] });
                } else {
                    toRemove.add(dataset);
                }
            }
            filterInPlace(chart.data.datasets, (dataset) => !toRemove.has(dataset));

            for (let i = 0; i < values.length; i++) {
                const dataset = datasetsById.get(values[i].id);
                if (!dataset) {
                    chart.data.datasets.push($state.snapshot(values[i]));
                } else {
                    dataset.data.length = values[i].data.length;
                    for (let j = 0; j < dataset.data.length; j++) {
                        dataset.data[j] = values[i].data[j];
                    }
                }
            }

            chart.update();
        }
    }, props.values);
    $effect(() => {
        valuesChangesTracker.set(props.values);
    });
</script>

<canvas bind:this={chartCanvas}></canvas>
