<script lang="ts">
    import { TabPane } from '@sveltestrap/sveltestrap';
    import type { Props } from './Tab';
    import InlineIcon from './InlineIcon.svelte';

    const props: Props = $props();
</script>

<TabPane tabId={props.id} style="height: 100%; overflow-y: hidden" active={props.default}>
    <div slot="tab">
        {#if props.icon !== undefined}
            <span class="me-1"><InlineIcon icon={props.icon} /></span>
        {/if}
        {#if typeof props.title === 'string'}
            {props.title}
        {:else}
            {@render props.title?.()}
        {/if}
    </div>

    {@render props.children?.()}
</TabPane>
