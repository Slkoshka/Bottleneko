<script lang="ts">
    import type { ActivityStatsDto } from '$lib/api/dtos.gen';
    import DashboardCard from './DashboardCard.svelte';
    import { ButtonGroup, Dropdown, DropdownItem, DropdownMenu } from '@sveltestrap/sveltestrap';
    import IconButton from '$lib/components/IconButton.svelte';
    import { DropdownToggle } from '@sveltestrap/sveltestrap';
    import { RemoteData } from '$lib/provider.svelte';
    import LoadingBanner from '$lib/components/LoadingBanner.svelte';
    import { onDestroy } from 'svelte';
    import Chart from '$lib/components/Chart.svelte';
    import { getPeriod } from './ActivityHistoryGraphCard';
    import { resolved } from '$lib';

    let period = $state(getPeriod('last-day', 'total-messages'));

    const stats = new RemoteData<ActivityStatsDto>(
        () => {
            return resolved({ items: [] });
        },
        { keepStale: true, autoRefresh: 60000 },
    );

    $effect(() => {
        stats.fetch = period.fetch;
        void stats.refresh();
    });
    onDestroy(() => {
        stats.destroy();
    });
</script>

<DashboardCard class="w-100" style="height: 300px">
    {#snippet title()}
        <div style:display="grid" style:gap="0.6em" style:grid-template-columns="1fr 0fr">
            Activity History

            <ButtonGroup>
                <Dropdown group>
                    <DropdownToggle size="sm" color="dark" class="dropdown-toggle">
                        {period.name}
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem onclick={() => (period = getPeriod('last-year', period.values))}
                            >Last Year</DropdownItem
                        >
                        <DropdownItem onclick={() => (period = getPeriod('last-month', period.values))}
                            >Last Month</DropdownItem
                        >
                        <DropdownItem onclick={() => (period = getPeriod('last-day', period.values))}
                            >Last Day</DropdownItem
                        >
                        <DropdownItem onclick={() => (period = getPeriod('last-hour', period.values))}
                            >Last Hour</DropdownItem
                        >
                    </DropdownMenu>
                </Dropdown>

                <Dropdown group>
                    <DropdownToggle size="sm" color="dark" class="dropdown-toggle">
                        {period.data([]).label}
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem onclick={() => (period = getPeriod(period.id, 'total-messages'))}
                            ># of Messages</DropdownItem
                        >
                        <DropdownItem onclick={() => (period = getPeriod(period.id, 'messages-per-minute'))}
                            >Messages per Minute</DropdownItem
                        >
                    </DropdownMenu>
                </Dropdown>

                <IconButton icon="arrow-clockwise" tooltip="Refresh" variant="dark" onclick={() => stats.refresh()} />
            </ButtonGroup>
        </div>
    {/snippet}

    {#if stats.data}
        {#key `${period.id}|${period.values}`}
            <Chart labels={stats.data.items.map((item) => item.period)} values={[period.data(stats.data.items)]} />
        {/key}
    {:else}
        <LoadingBanner size="lg" />
    {/if}
</DashboardCard>
