<script lang="ts">
    import { blur } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import type { ChatMessageLetter } from '$lib/api/dtos.gen';
    import { Subscriber } from '../ws/WebSocketConnection.svelte';
    import type { Props } from './MessageHistoryViewer';
    import { Button, Card, CardBody, CardFooter, CardHeader } from '@sveltestrap/sveltestrap';
    import dateFormat from 'dateformat';
    import api from '$lib/api';
    import MessageConnectionDisplay from './MessageConnectionDisplay.svelte';
    import IconButton from '$lib/components/IconButton.svelte';
    import InlineIcon from '$lib/components/InlineIcon.svelte';
    import LoadingBanner from '$lib/components/LoadingBanner.svelte';

    const props: Props = $props();

    const subscriber = new Subscriber<ChatMessageLetter>();
    $effect(() => {
        subscriber.subscribe({
            topic: { $type: 'ChatMessages', filter: { connectionId: props.connectionId ?? null } },
        });
    });
</script>

<div style="overflow-y: scroll" class="h-100 card p-1">
    {#if subscriber.mail.length > 0}
        {#each subscriber.mail as letter (letter.content.id)}
            <div
                class="mb-2"
                style="max-width: 600px; width: 100%"
                in:blur|global={{ duration: 300 }}
                animate:flip={{ duration: 300 }}
            >
                <Card class="w-100 border-light border-opacity-25 shadow">
                    <CardHeader class="py-1 px-2">
                        <div class="d-flex flex-row align-items-center" style="gap: 0.5em; height: 2em">
                            <div class="text-collapse">
                                {#if letter.content.isDirect}
                                    <span
                                        ><strong>Direct message</strong> from
                                        <strong>{letter.content.author.name}</strong></span
                                    >
                                {:else}
                                    <span
                                        ><strong>{letter.content.author.name}</strong> in
                                        <strong>{letter.content.chat.name}</strong></span
                                    >
                                {/if}
                            </div>
                            <div class="ms-auto d-flex" style:gap="0.25em">
                                {#if letter.content.isSpecial}
                                    <IconButton
                                        icon="patch-exclamation"
                                        variant="warning"
                                        tooltip="Special message"
                                        size="2em"
                                    />
                                {/if}
                                {#if letter.content.isDirect}
                                    <IconButton
                                        icon="chat-square-dots-fill"
                                        variant="primary"
                                        tooltip="Direct message"
                                        size="2em"
                                    />
                                {/if}
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody class="pd-3">
                        <div class="d-flex flex-column" style:gap="1em">
                            <div>
                                {#if letter.content.textContent === null || letter.content.textContent === ''}
                                    <p class="text-secondary m-0" style="text-align: center">(no text)</p>
                                {:else}
                                    <p class="m-0">
                                        {letter.content.textContent}
                                    </p>
                                {/if}
                            </div>
                            {#if letter.content.attachments.length > 0}
                                <div class="d-flex flex-column" style:gap="0.25em">
                                    {#each letter.content.attachments as attachment (attachment.id)}
                                        <Button
                                            size="sm"
                                            target="_blank"
                                            rel="noreferrer"
                                            color="primary"
                                            class="text-collapse"
                                            href={api.connections.getAttachmentUrl(
                                                letter.content.connectionId,
                                                attachment.id,
                                            )}
                                        >
                                            <InlineIcon icon="file-earmark-arrow-down-fill" />
                                            {attachment.name ?? 'no name'}
                                        </Button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </CardBody>

                    <CardFooter class="d-flex flex-row px-2 align-items-center" style="gap: 0.5em; height: 2em">
                        {#if props.connectionId === undefined}
                            <MessageConnectionDisplay
                                style="max-width: 50%"
                                variant="primary"
                                connectionId={letter.content.connectionId}
                            />
                        {/if}
                        <small class="text-secondary ms-auto"
                            >{dateFormat(new Date(letter.content.timestamp), 'yyyy-mm-dd HH:MM:ss')}</small
                        >
                    </CardFooter>
                </Card>
            </div>
        {/each}
    {:else if !subscriber.isLoading}
        <div class="w-100 h-100 d-flex justify-content-center align-items-center">
            <p class="text-secondary" style="text-align: center">(no messages)</p>
        </div>
    {:else}
        <LoadingBanner size="lg" />
    {/if}
</div>
