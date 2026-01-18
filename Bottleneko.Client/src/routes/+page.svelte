<script lang="ts">
    import api from '$lib/api';
    import { type EnvironmentInfoDto } from '$lib/api/dtos.gen';
    import View from '$lib/components/View.svelte';
    import { Tooltip } from '@sveltestrap/sveltestrap';
    import LoadingBanner from '$lib/components/LoadingBanner.svelte';
    import CopyableLabel from '$lib/components/CopyableLabel.svelte';
    import { RemoteData } from '$lib/provider.svelte';
    import { Table } from '@sveltestrap/sveltestrap';
    import { onDestroy } from 'svelte';
    import { formatDuration, Timer } from '$lib';
    import { brand } from '$lib/props';
    import { SvelteDate } from 'svelte/reactivity';
    import dateFormat from 'dateformat';
    import InlineIcon from '$lib/components/InlineIcon.svelte';
    import { Connections } from '$lib/features/connections';
    import DashboardCard from './DashboardCard.svelte';
    import ActivityHistoryGraphCard from './ActivityHistoryGraphCard.svelte';

    let systemInfo = $state(null) as EnvironmentInfoDto | null;
    const remoteSystemInfo = new RemoteData<EnvironmentInfoDto>(api.system.getInfo, {
        keepStale: true,
        autoRefresh: 3000,
        onDataUpdated: (data) => (systemInfo = data),
    });
    onDestroy(() => {
        remoteSystemInfo.destroy();
    });

    let botUptime: string | null = $derived(systemInfo ? formatDuration(systemInfo.neko.uptime) : null);
    let systemUptime: string | null = $derived(systemInfo ? formatDuration(systemInfo.system.uptime) : null);
    let serverTime: SvelteDate | null = $derived(systemInfo ? new SvelteDate(systemInfo.system.currentTime) : null);
    let showBlinking = $state(false);

    new Timer(
        () => {
            if (systemInfo) {
                botUptime = formatDuration(
                    systemInfo.neko.uptime + (Date.now() - remoteSystemInfo.lastRefresh.getTime()) / 1000,
                );
                systemUptime = formatDuration(
                    systemInfo.system.uptime + (Date.now() - remoteSystemInfo.lastRefresh.getTime()) / 1000,
                );
                serverTime = new SvelteDate(
                    new Date(systemInfo.system.currentTime).getTime() +
                        (Date.now() - remoteSystemInfo.lastRefresh.getTime()),
                );
            }

            showBlinking = !showBlinking;
        },
        500,
        true,
    );

    const systemVersion = $derived(
        systemInfo ? `${systemInfo.system.operatingSystem} (${systemInfo.system.arch})` : '',
    );

    const connectionsWithErrors = $derived(
        Connections.provider?.list
            ? Connections.provider.list.filter((c) => c.data.extendedStatus.status === 'Error')
            : [],
    );

    let versionElement: HTMLElement | null = $state(null);
    let systemVersionElement: HTMLElement | null = $state(null);
</script>

{#snippet botCard()}
    <Table>
        <tbody>
            <tr>
                <td>Version</td>
                <td>
                    {#if systemInfo}
                        <CopyableLabel text={systemInfo.neko.version}>
                            <span class="text-collapse" bind:this={versionElement}>{systemInfo.neko.version}</span>
                            <Tooltip target={versionElement} placement="bottom" theme="light"
                                >{systemInfo.neko.version}</Tooltip
                            >
                        </CopyableLabel>
                    {:else}
                        <LoadingBanner />
                    {/if}
                </td>
            </tr>
            <tr>
                <td>Uptime</td>
                <td>
                    {#if botUptime}
                        {botUptime}
                    {:else}
                        <LoadingBanner />
                    {/if}
                </td>
            </tr>
            <tr>
                <td>.NET Version</td>
                <td>
                    {#if systemInfo}
                        {systemInfo.system.dotNetVersion}
                    {:else}
                        <LoadingBanner />
                    {/if}
                </td>
            </tr>
        </tbody>
    </Table>
{/snippet}

{#snippet systemCard()}
    <Table>
        <tbody>
            <tr>
                <td>Hostname</td>
                <td>
                    {#if systemInfo}
                        {systemInfo.system.hostname}
                    {:else}
                        <LoadingBanner />
                    {/if}
                </td>
            </tr>
            <tr>
                <td>OS</td>
                <td>
                    {#if systemVersion}
                        <CopyableLabel text={systemVersion}>
                            <span class="text-collapse" bind:this={systemVersionElement}>{systemVersion}</span>
                            <Tooltip target={systemVersionElement} placement="bottom" theme="light"
                                >{systemVersion}</Tooltip
                            >
                        </CopyableLabel>
                    {:else}
                        <LoadingBanner />
                    {/if}
                </td>
            </tr>
            <tr>
                <td>Uptime</td>
                <td>
                    {#if systemUptime}
                        {systemUptime}
                    {:else}
                        <LoadingBanner />
                    {/if}
                </td>
            </tr>
            <tr>
                <td>Server Time</td>
                <td>
                    {#if serverTime}
                        {dateFormat(new Date(serverTime.getTime()), 'yyyy-mm-dd HH:MM:ss')}
                    {:else}
                        <LoadingBanner />
                    {/if}
                </td>
            </tr>
        </tbody>
    </Table>
{/snippet}

{#snippet connectionsCard()}
    <Table>
        <tbody>
            <tr>
                <td class="w-50">Connected</td>
                <td class="w-50">
                    {#if Connections.provider?.list}
                        {Connections.provider.list.filter((c) => c.data.extendedStatus.status === 'Connected').length} of
                        {Connections.provider.list.length}
                    {/if}
                </td>
            </tr>
            <tr>
                <td>Failed</td>
                <td>
                    {#if Connections.provider?.list}
                        {connectionsWithErrors.length} of {Connections.provider.list.length}
                        <span
                            class="text-danger"
                            style:margin-left="0.5em"
                            style:opacity={showBlinking && connectionsWithErrors.length > 0 ? '1' : '0'}
                            ><InlineIcon size="1.5em" icon="exclamation-diamond-fill" /></span
                        >
                    {/if}
                </td>
            </tr>
            <tr>
                <td class="w-50">Disconnected</td>
                <td class="w-50">
                    {#if Connections.provider?.list}
                        {Connections.provider.list.filter((c) => c.data.extendedStatus.status === 'NotConnected')
                            .length} of {Connections.provider.list.length}
                    {/if}
                </td>
            </tr>
        </tbody>
    </Table>
{/snippet}

<View title="Dashboard">
    <div class="d-flex flex-column" style:gap="30px">
        <ActivityHistoryGraphCard />

        <div class="d-flex flex-wrap justify-content-start align-items-stretch" style:gap="30px">
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
            <DashboardCard title={brand.plain}>{@render botCard()}</DashboardCard>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
            <DashboardCard title="System">{@render systemCard()}</DashboardCard>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
            <DashboardCard title="Connections">{@render connectionsCard()}</DashboardCard>
        </div>
    </div>
</View>
