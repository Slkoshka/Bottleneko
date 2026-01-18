<script lang="ts">
    import type { Props } from './MouseBlocker';

    const props: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    style:display="contents"
    onclick={(e) => {
        e.stopPropagation();
    }}
>
    {@render props.children()}
</div>
