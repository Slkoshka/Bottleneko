<script lang="ts">
    import * as yup from 'yup';
    import FullscreenPage from './FullscreenPage.svelte';
    import { brand } from '$lib/props';
    import { Form, FormGroup, Input, Label } from '@sveltestrap/sveltestrap';
    import api from '$lib/api';
    import { authState, login } from '$lib/features/auth.svelte';
    import { RequestError } from '$lib/api/errors';
    import { onDestroy } from 'svelte';
    import { FormState } from '$lib/FormState.svelte';

    export const LoginSchema = yup.object().shape({
        login: yup.string().default('').required('Username is required'),
        password: yup.string().default('').required('Password is required'),
    });

    class LoginFormState extends FormState<typeof LoginSchema> {
        showErrorTimer: ReturnType<typeof setTimeout> | null = $state(null);

        constructor() {
            super(LoginSchema);
            onDestroy(this.destroy.bind(this));
        }

        override onRequestError(err: unknown) {
            if (err instanceof RequestError) {
                switch (err.code) {
                    case 'Unauthorized':
                        this.showError('Invalid username or password');
                        return;

                    case 'SetupRequired':
                        authState.data = { status: 'setup-required', me: null };
                        return;
                }
            }

            super.onRequestError(err);
        }

        override showError(err: string | null): void {
            super.showError(err);

            if (err !== null) {
                this.showErrorTimer = setTimeout(() => {
                    this.showError(null);
                }, 1500);
            } else if (this.showErrorTimer !== null) {
                clearTimeout(this.showErrorTimer);
                this.showErrorTimer = null;
            }
        }

        override async send(data: yup.InferType<typeof LoginSchema>) {
            await login((await api.users.login(data.login, data.password)).accessToken);
        }

        destroy() {
            if (this.showErrorTimer !== null) {
                clearTimeout(this.showErrorTimer);
            }
        }
    }

    const formState = new LoginFormState();
</script>

{#snippet renderTitle()}
    {#if formState.error}
        {formState.error}
    {:else}
        Login to {brand.plain}
    {/if}
{/snippet}

<Form
    novalidate
    onsubmit={async (e: SubmitEvent) => {
        await formState.submit(e);
    }}
>
    <FullscreenPage
        title={{ children: renderTitle, variant: formState.hasErrors ? 'danger' : undefined }}
        buttons={[{ children: 'Sign in', action: 'submit' }]}
    >
        <FormGroup class="mb-3">
            <Label class="fs-5">Username</Label>
            <Input
                name="login"
                bind:value={formState.data.login}
                feedback={formState.validationErrors.login}
                invalid={!!formState.validationErrors.login}
                disabled={formState.isLoading}
            />
        </FormGroup>

        <FormGroup class="mb-3">
            <Label class="fs-5">Password</Label>
            <Input
                type="password"
                name="password"
                bind:value={formState.data.password}
                feedback={formState.validationErrors.password}
                invalid={!!formState.validationErrors.password}
                disabled={formState.isLoading}
            />
        </FormGroup>
    </FullscreenPage>
</Form>
