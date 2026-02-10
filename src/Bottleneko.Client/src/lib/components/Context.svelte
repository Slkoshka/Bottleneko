<script lang="ts">
    import type { Props } from './Context';

    const props: Props = $props();

    $effect(() => {
        const data = props.type.factory?.();

        return () => {
            data?.destroy();
        };
    });
</script>
