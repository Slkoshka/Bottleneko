<script lang="ts">
    import InlineIcon from '$lib/components/InlineIcon.svelte';
    import { protocols } from '.';
    import type { Props } from './ProtocolIcon';

    const props: Props = $props();
</script>

<InlineIcon
    icon={props.protocol ? protocols[props.protocol].icon : 'wifi'}
    tooltip={props.protocol ? protocols[props.protocol].name : undefined}
    size={props.size}
/>
