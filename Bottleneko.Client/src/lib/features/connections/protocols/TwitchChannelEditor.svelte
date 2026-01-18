<script lang="ts">
    import { resolved } from '$lib';
    import ModalDialog from '$lib/components/ModalDialog.svelte';
    import { FormState } from '$lib/FormState.svelte';
    import {
        Button,
        Card,
        CardBody,
        CardHeader,
        Form,
        FormFeedback,
        FormGroup,
        FormText,
        Input,
        Label,
    } from '@sveltestrap/sveltestrap';
    import { type Props } from './TwitchChannelEditor';
    import { topicsInfo, TwitchProtocolChannelSchema } from './TwitchConfigEditor';

    const props: Props = $props();
    const formState = $derived(
        new FormState(TwitchProtocolChannelSchema, props.channel, async (data) => {
            props.onsuccess?.($state.snapshot(data));
            await resolved(undefined);
        }),
    );

    const topics = $derived([...topicsInfo.entries()].filter(([, v]) => v.target !== 'self' || props['is-mine']));
</script>

<ModalDialog title="Twitch Channel" show={props.show} onclose={props.onclose} size="lg">
    <Form
        novalidate
        onsubmit={(e: SubmitEvent) => {
            void formState.submit(e);
        }}
        class="d-flex flex-column p-2"
        style="gap: 1rem"
    >
        <FormGroup>
            <Label>Channel name</Label>
            <Input
                bind:value={formState.data.name}
                invalid={!!formState.validationErrors.name}
                readonly={props['is-mine']}
                autocomplete="off"
            />
            <FormText>
                Twitch channel name. Should be the channel&apos;s non-localized name (i.e., the one displayed using the
                English alphabet). You can read more about localized display names <a
                    href="https://help.twitch.tv/s/article/display-names-on-twitch?language=en_US#localized"
                    target="_blank"
                    rel="noreferrer">here</a
                >.
            </FormText>
            <FormFeedback valid={!formState.validationErrors.name}>
                {formState.validationErrors.name}
            </FormFeedback>
        </FormGroup>

        <Card>
            <CardHeader>Event subscriptions</CardHeader>
            <CardBody>
                {#each topics as [id, topic] (id)}
                    <FormGroup class="mb-1">
                        <Input
                            type="switch"
                            class="mb-0"
                            label={topic.name}
                            checked={formState.data.eventSubscriptions.includes(id)}
                            onchange={() => {
                                const index = formState.data.eventSubscriptions.indexOf(id);
                                const subs = [...formState.data.eventSubscriptions];
                                if (index >= 0) {
                                    subs.splice(index, 1);
                                } else {
                                    subs.push(id);
                                }
                                formState.data.eventSubscriptions = subs;
                            }}
                        />
                        <FormText>
                            <span>
                                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                                <span>{@html topic.description}</span>
                                <a href={topic.infoUrl} target="_blank" rel="external">Docs</a>.
                                {#if !props['is-mine'] && topic.cost > 0}
                                    <strong>Cost: {topic.cost}</strong>
                                {/if}
                            </span>
                        </FormText>
                    </FormGroup>
                {/each}
            </CardBody>
        </Card>
    </Form>

    {#snippet footer()}
        <Button onclick={props.onclose} color="secondary">Cancel</Button>
        <Button
            onclick={async () => {
                await formState.submit();
            }}
            color="primary">Save</Button
        >
    {/snippet}
</ModalDialog>
