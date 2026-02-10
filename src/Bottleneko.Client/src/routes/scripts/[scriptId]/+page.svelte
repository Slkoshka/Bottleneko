<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';

    void goto(
        resolve('/scripts/[scriptId]/[scriptTab=scriptTab]', {
            scriptId: page.params.scriptId ?? '',
            scriptTab: 'logs',
        }),
        { replaceState: true },
    );
</script>
