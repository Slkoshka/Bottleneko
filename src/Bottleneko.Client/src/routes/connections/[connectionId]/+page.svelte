<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';

    void goto(
        resolve('/connections/[connectionId]/[connectionTab=connectionTab]', {
            connectionId: page.params.connectionId ?? '',
            connectionTab: 'messages',
        }),
        { replaceState: true },
    );
</script>
