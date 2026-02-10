<script lang="ts">
    import FullscreenPage from './FullscreenPage.svelte';
    import wearyCatFace from '@netbek/noto-emoji/build/svg/u1f640.svg';
    import smilingCatFaceWithOpenMouth from '@netbek/noto-emoji/build/svg/u1f63a.svg';
    import type { SetupPageStage, SetupPageView } from './SetupPage';
    import { brand } from '$lib/props';
    import type { ButtonDefinition } from './FullscreenPage';
    import { Progress } from '@sveltestrap/sveltestrap';
    import AccountSetupView from '$lib/features/setup/AccountSetupView.svelte';
    import WelcomeSetupView from '$lib/features/setup/WelcomeSetupView.svelte';
    import InitializationErrorSetupView from '$lib/features/setup/InitializationErrorSetupView.svelte';
    import InitializingSetupView from '$lib/features/setup/InitializingSetupView.svelte';
    import FinishSetupView from '$lib/features/setup/FinishSetupView.svelte';

    let stage: SetupPageStage = $state({ id: 'welcome' });
    let view: SetupPageView | undefined = $state();

    const params: {
        title: string;
        variant: StyleVariant;
        emoji?: { url: string; name: string };
        animated: boolean;
        progress: number;
        button: ButtonDefinition;
    } = $derived.by(() => {
        switch (stage.id) {
            case 'welcome':
                return {
                    title: `Welcome to ${brand.plain}!`,
                    variant: 'primary',
                    animated: false,
                    progress: 25,
                    emoji: {
                        url: wearyCatFace,
                        name: 'Weary Cat Face',
                    },
                    button: {
                        children: 'Next',
                        action: () => {
                            view?.submit?.();
                        },
                        disabled: false,
                    },
                };

            case 'account':
                return {
                    title: 'Create an account',
                    variant: 'primary',
                    animated: false,
                    progress: 50,
                    button: {
                        children: 'Next',
                        action: () => {
                            view?.submit?.();
                        },
                        disabled: false,
                    },
                };

            case 'initializing':
                return {
                    title: 'Setting up...',
                    variant: 'primary',
                    animated: true,
                    progress: 75,
                    button: {
                        children: 'Next',
                        disabled: true,
                    },
                };

            case 'initialization-error':
                return {
                    title: 'An error has occured',
                    variant: 'danger',
                    animated: false,
                    progress: 100,
                    button: {
                        children: 'Next',
                        action: () => {
                            view?.submit?.();
                        },
                        disabled: true,
                    },
                };

            case 'finish':
                return {
                    title: 'Setup completed!',
                    variant: 'primary',
                    animated: false,
                    progress: 100,
                    emoji: {
                        url: smilingCatFaceWithOpenMouth,
                        name: 'Smiling Cat Face with Open Mouth',
                    },
                    button: {
                        children: 'Finish',
                        action: () => {
                            view?.submit?.();
                        },
                        disabled: false,
                    },
                };

            default:
                return {
                    title: 'Error',
                    variant: 'danger',
                    animated: false,
                    progress: 100,
                    button: {
                        children: 'Next',
                        disabled: true,
                    },
                };
        }
    });

    const stageChange = (next: SetupPageStage) => {
        stage = next;
    };
</script>

<FullscreenPage title={{ children: params.title }} buttons={[params.button]}>
    <Progress
        animated={params.animated}
        striped={params.progress !== 100}
        color={params.variant}
        value={params.progress}
    />

    <hr />

    {#if params.emoji !== undefined}
        <p style:text-align="center">
            <img src={params.emoji.url} alt={params.emoji.name} style:width="6em" style:height="6em" />
        </p>
    {/if}

    {#if stage.id === 'welcome'}
        <WelcomeSetupView onstagechange={stageChange} bind:this={view} />
    {:else if stage.id === 'account'}
        <AccountSetupView onstagechange={stageChange} bind:this={view} />
    {:else if stage.id === 'initializing'}
        <InitializingSetupView
            login={stage.login}
            password={stage.password}
            onstagechange={stageChange}
            bind:this={view}
        />
    {:else if stage.id === 'initialization-error'}
        <InitializationErrorSetupView error={stage.error} onstagechange={stageChange} bind:this={view} />
    {:else if stage.id === 'finish'}
        <FinishSetupView access-token={stage.accessToken} onstagechange={stageChange} bind:this={view} />
    {/if}
</FullscreenPage>
