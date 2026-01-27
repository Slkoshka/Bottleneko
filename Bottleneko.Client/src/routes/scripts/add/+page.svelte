<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { type ScriptCode } from '$lib/api/bottleneko.gen';
    import IconButton from '$lib/components/IconButton.svelte';
    import View from '$lib/components/View.svelte';
    import { Scripts } from '$lib/features/scripts';
    import type { EditedScript } from '$lib/features/scripts/ScriptEditor';
    import ScriptEditor from '$lib/features/scripts/ScriptEditor.svelte';
    import templates from '$lib/features/scripts/templates';
    import { Accordion, AccordionItem, Card, CardBody, CardHeader } from '@sveltestrap/sveltestrap';

    type AddScriptStage = { id: 'template' } | { id: 'editor'; template: EditedScript };

    let stage: AddScriptStage = $state({ id: 'template' });

    const onsaved = async (script: EditedScript) => {
        const added = await Scripts.provider?.add(script);
        if (added) {
            await goto(resolve('/scripts/[scriptId]', { scriptId: added.data.id }));
        }
    };
</script>

{#snippet renderTemplate(template: { name: string; description: string; code: ScriptCode })}
    <Card class="info-card">
        <CardHeader
            class="info-card-header highlight"
            style="display: grid; gap: 0.6em; grid-template-columns: 1fr 0fr"
        >
            <div class="flex-grow-1 text-truncate">
                <span class="fs-5">
                    {template.name}
                </span>
            </div>
            <IconButton
                icon="plus-lg"
                tooltip="Select template"
                size="sm"
                variant="dark"
                onclick={() =>
                    (stage = { id: 'editor', template: { name: template.name, description: '', code: template.code } })}
            />
        </CardHeader>

        <CardBody>
            {#if template.description === ''}
                <em class="text-secondary fst-italic">No description</em>
            {:else}
                {@html template.description}
            {/if}
        </CardBody>
    </Card>
{/snippet}

<View title="Create a new script" fill-screen>
    {#if stage.id === 'template'}
        <div>
            <Accordion stayOpen>
                {#each Object.entries(templates) as [categoryId, category] (categoryId)}
                    <AccordionItem header={category.name} active>
                        <div
                            class="d-flex flex-column"
                            style:gap="10px"
                            style:width="calc(min(100%, 600px))"
                            style:max-width="600px"
                        >
                            {#each Object.entries(category.templates) as [id, template] (id)}
                                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
                                {@render renderTemplate(template)}
                            {/each}
                        </div>
                    </AccordionItem>
                {/each}
            </Accordion>
        </div>
    {:else if stage.id === 'editor'}
        <ScriptEditor script={stage.template} {onsaved} />
    {/if}
</View>
