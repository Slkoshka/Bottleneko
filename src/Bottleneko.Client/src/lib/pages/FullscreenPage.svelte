<script lang="ts">
    import { Button, Card, CardBody, CardFooter, CardHeader } from '@sveltestrap/sveltestrap';
    import type { Props } from './FullscreenPage';

    const { title, children, buttons }: Props = $props();
</script>

<div class="d-flex vw-100 vh-100 align-items-center justify-content-center">
    <Card class="shadow" style="width: 560px">
        <CardHeader tag="h3" class={['p-3', `text-bg-${title.variant ?? 'primary'}`]}>
            {#if typeof title.children === 'string'}
                {title.children}
            {:else}
                {@render title.children()}
            {/if}
        </CardHeader>

        <CardBody>
            <div class="card-text">
                {@render children()}
            </div>
        </CardBody>

        {#if (buttons?.length ?? 0) > 0}
            <CardFooter>
                <div class="float-end">
                    {#each buttons as button (button)}
                        <Button
                            size={button.size ?? 'lg'}
                            class="mx-2 px-4"
                            color={button.variant ?? 'primary'}
                            disabled={button.disabled}
                            type={typeof button.action === 'string' ? button.action : undefined}
                            onclick={typeof button.action === 'function' ? button.action : undefined}
                        >
                            {#if typeof button.children === 'string'}
                                {button.children}
                            {:else}
                                {@render button.children()}
                            {/if}
                        </Button>
                    {/each}
                </div>
            </CardFooter>
        {/if}
    </Card>
</div>
