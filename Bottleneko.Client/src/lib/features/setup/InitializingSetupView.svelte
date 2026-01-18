<script lang="ts">
    import { extractErrorInfo } from '$lib';
    import api from '$lib/api';
    import LoadingBanner from '$lib/components/LoadingBanner.svelte';
    import type { SetupPageViewProps } from '$lib/pages/SetupPage';

    const props: SetupPageViewProps & { login: string; password: string } = $props();

    $effect(() => {
        api.system
            .setup(props.login, props.password)
            .then(() => {
                return api.users.login(props.login, props.password);
            })
            .then((result) => {
                props.onstagechange({ id: 'finish', accessToken: result.accessToken });
            })
            .catch((err: unknown) => {
                props.onstagechange({ id: 'initialization-error', error: extractErrorInfo(err) });
            });
    });
</script>

<LoadingBanner size="lg" />
