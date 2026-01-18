<script lang="ts">
    import { ChangesTracker } from '$lib';
    import { type UserDto } from '$lib/api/dtos.gen';
    import ModalDialog from '$lib/components/ModalDialog.svelte';
    import { FormState } from '$lib/FormState.svelte';
    import { Alert, Button, Form, FormFeedback, FormGroup, FormText, Input, Label } from '@sveltestrap/sveltestrap';
    import * as yup from 'yup';
    import type { Props } from './UserEditor';

    const props: Props = $props();

    const passwordField = $derived(
        props.user ? yup.string().default('') : yup.string().default('').required('Password cannot be empty'),
    );

    const FormSchema = $derived(
        yup.object().shape({
            login: yup.string().default('').required('Username cannot be empty'),
            password: passwordField,
        }),
    );

    const formState = $derived(
        new FormState(FormSchema, { ...FormSchema.getDefault(), ...(props.user ?? {}) }, async (data) => {
            await props.onsuccess?.(data);
        }),
    );

    const userChangesTracker = new ChangesTracker<UserDto | null>((_, value) => {
        if (!value) {
            formState.data = FormSchema.getDefault();
        } else {
            formState.data = { login: value.login, password: '' };
        }
        formState.clearErrors();
    }, props.user);

    $effect(() => {
        userChangesTracker.set(props.user);
    });

    const showChangesTracker = new ChangesTracker<boolean>((_, value) => {
        if (value) {
            userChangesTracker.forceUpdate(props.user);
        }
    }, props.show);
    $effect(() => {
        showChangesTracker.set(props.show);
    });
</script>

<ModalDialog title="User settings" show={props.show} onclose={props.onclose} size="lg">
    <Form
        novalidate
        onsubmit={async (e: SubmitEvent) => {
            await formState.submit(e);
        }}
        class="d-flex flex-column p-2"
        style="gap: 1rem"
    >
        {#if formState.error}
            <Alert color="danger">
                {formState.error}
            </Alert>
        {/if}

        <FormGroup>
            <Label>Username</Label>
            <Input
                bind:value={formState.data.login}
                invalid={!!formState.validationErrors.login}
                autocomplete="off"
                disabled={formState.isLoading}
            />
            <FormText>Usernames are case-insensitive and must be unique among all users.</FormText>
            <FormFeedback valid={!formState.validationErrors.login}>
                {formState.validationErrors.login}
            </FormFeedback>
        </FormGroup>

        <FormGroup>
            <Label>Password</Label>
            <Input
                type="password"
                bind:value={formState.data.password}
                invalid={!!formState.validationErrors.password}
                autocomplete="off"
                disabled={formState.isLoading}
            />
            <FormText>
                {#if props.user}
                    Leave empty to keep the current password.
                {:else}
                    Password must be non-empty.
                {/if}
            </FormText>
            <FormFeedback valid={!formState.validationErrors.password}>
                {formState.validationErrors.password}
            </FormFeedback>
        </FormGroup>
    </Form>

    {#snippet footer()}
        <Button onclick={() => props.onclose?.()} color="secondary">Back</Button>
        <Button onclick={() => formState.submit()} color="primary">Save</Button>
    {/snippet}
</ModalDialog>
