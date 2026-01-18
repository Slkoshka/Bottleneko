<script lang="ts">
    import { Alert, Form, FormFeedback, FormGroup, Input, Label } from '@sveltestrap/sveltestrap';
    import { FormSchema } from './AccountSetupView';
    import { FormState } from '$lib/FormState.svelte';
    import { resolved } from '$lib';
    import type { SetupPageViewProps } from '$lib/pages/SetupPage';

    const props: SetupPageViewProps = $props();

    const formState = new FormState(FormSchema, undefined, async (data) => {
        props.onstagechange({ id: 'initializing', login: data.login, password: data.password });
        await resolved(undefined);
    });

    export const submit = () => {
        void formState.submit();
    };
</script>

<Form>
    <FormGroup class="mb-3">
        <Label class="fs-5">Username</Label>
        <Input name="login" bind:value={formState.data.login} invalid={!!formState.validationErrors.login} />
        <FormFeedback valid={!formState.validationErrors.login}>
            {formState.validationErrors.login}
        </FormFeedback>
    </FormGroup>

    <FormGroup class="mb-3">
        <Label class="fs-5">Password</Label>
        <Input
            type="password"
            name="password"
            bind:value={formState.data.password}
            invalid={!!formState.validationErrors.password}
        />
        <FormFeedback valid={!formState.validationErrors.password}>
            {formState.validationErrors.password}
        </FormFeedback>
    </FormGroup>

    <FormGroup class="mb-3">
        <Label class="fs-5">Confirm password</Label>
        <Input
            type="password"
            name="passwordConfirmation"
            bind:value={formState.data.passwordConfirmation}
            invalid={!!formState.validationErrors.passwordConfirmation}
        />
        <FormFeedback valid={!formState.validationErrors.passwordConfirmation}>
            {formState.validationErrors.passwordConfirmation}
        </FormFeedback>
    </FormGroup>

    <hr />

    <Alert color="dark">You&apos;ll be able to create additional accounts after completing the initial setup.</Alert>
</Form>
