<script lang="ts">
    import View from './View.svelte';
    import { TabContent } from '@sveltestrap/sveltestrap';
    import type { Props } from './TabView';

    const props: Props = $props();

    const extraProps = { pills: true };

    let currentTab = $state(null) as string | number | null;
    const onTabChanged = (tab: string | number) => {
        if (currentTab === null) {
            currentTab = tab;
        } else if (tab !== currentTab) {
            currentTab = tab;
            props.ontabchanged?.(tab);
        }
    };
</script>

<View title={props.title} variant="base" fill-screen={props['fill-screen']} loading={props.loading}>
    <TabContent
        {...extraProps}
        on:tab={(e) => {
            onTabChanged(e.detail);
        }}
    >
        {@render props.children?.()}
    </TabContent>
</View>
