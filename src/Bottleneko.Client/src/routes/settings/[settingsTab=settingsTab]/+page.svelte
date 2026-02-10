<script lang="ts">
    import TabView from '$lib/components/TabView.svelte';
    import Tab from '$lib/components/Tab.svelte';
    import LogViewer from '$lib/features/log/LogViewer.svelte';
    import ProxySettings from '$lib/features/proxies/ProxySettings.svelte';
    import UserSettings from '$lib/features/users/UserSettings.svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
</script>

{#key page.params.settingsTab}
    <TabView
        title="Settings"
        fill-screen
        ontabchanged={(tab) => goto(resolve('/settings/[settingsTab=settingsTab]', { settingsTab: tab as string }))}
    >
        <Tab id="network" icon="hdd-network" title="Network" default={page.params.settingsTab === 'network'}>
            <ProxySettings />
        </Tab>

        <Tab id="users" icon="person-fill-gear" title="Users" default={page.params.settingsTab === 'users'}>
            <UserSettings />
        </Tab>

        <Tab id="logs" icon="terminal" title="Logs" default={page.params.settingsTab === 'logs'}>
            <LogViewer />
        </Tab>
    </TabView>
{/key}
