<script lang="ts">
    import { FormState } from '$lib/FormState.svelte';
    import { Alert, Button, Form, FormFeedback, FormGroup, Input, Label } from '@sveltestrap/sveltestrap';
    import JsScriptEditor from './js/JsScriptEditor.svelte';
    import { EditedScriptSchema, type Props } from './ScriptEditor';
    import { type ScriptCode } from '$lib/api/bottleneko.gen';

    const props: Props = $props();

    const formState = $derived(
        new FormState(EditedScriptSchema, props.script, async (data) => {
            await props.onsaved($state.snapshot(data));
        }),
    );
</script>

<Form
    class="d-flex flex-column flex-grow-1 h-100"
    style="gap: 10px"
    novalidate
    onsubmit={async (e: SubmitEvent) => {
        await formState.submit(e);
    }}
>
    {#if formState.error}
        <Alert color="danger">
            {formState.error}
        </Alert>
    {/if}

    <FormGroup>
        <Label>Name</Label>
        <Input
            bind:value={formState.data.name}
            invalid={!!formState.validationErrors.name}
            disabled={formState.isLoading}
        />
        <FormFeedback valid={!formState.validationErrors.name}>
            {formState.validationErrors.name}
        </FormFeedback>
    </FormGroup>

    <FormGroup>
        <Label>Description</Label>
        <Input
            type="textarea"
            rows={2}
            bind:value={formState.data.description}
            invalid={!!formState.validationErrors.description}
            disabled={formState.isLoading}
        />
        <FormFeedback valid={!formState.validationErrors.description}>
            {formState.validationErrors.description}
        </FormFeedback>
    </FormGroup>

    <span>Code</span>
    <JsScriptEditor
        initialCode={props.script.code.source}
        onchange={(code: ScriptCode) => {
            formState.data.code = code;
        }}
    />
    <hr />

    <div class="d-flex justify-content-center">
        <Button
            size="lg"
            style="width: min(15%, 400px); min-width: 200px"
            type="submit"
            color="primary"
            disabled={formState.isLoading}
        >
            {#if props.id}
                {formState.isLoading ? 'Saving...' : 'Save'}
            {:else}
                {formState.isLoading ? 'Creating...' : 'Create'}
            {/if}
        </Button>
    </div>
</Form>
