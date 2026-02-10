<script lang="ts">
    import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg';
    import MouseBlocker from '$lib/components/MouseBlocker.svelte';
    import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from '@sveltestrap/sveltestrap';
    import InlineIcon from '$lib/components/InlineIcon.svelte';
    import type { Props } from './UserListRowRenderer';

    const props: Props = $props();
</script>

{#if props.column === 'id'}
    {props.row.data.id}
{:else if props.column === 'login'}
    {props.row.data.login}
{:else if props.column === 'displayName'}
    {props.row.data.displayName}
{:else if props.column === 'actions'}
    <div class="w-100 d-flex gap-2 justify-content-end">
        <MouseBlocker>
            <Dropdown>
                <DropdownToggle style="width: 2em; height: 2em; padding: 0; display: block" color="primary">
                    <svg class="bi" fill="currentColor" style="width: 70%; height: 70%; margin: 15%">
                        <use xlink:href={`${bootstrapIcons}#list`} />
                    </svg>
                </DropdownToggle>
                <DropdownMenu>
                    <DropdownItem
                        onclick={() => {
                            props.onedit(props.row);
                        }}
                    >
                        <InlineIcon icon="gear-fill" />
                        <span style:margin-left="0.5em">Edit</span>
                    </DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem
                        onclick={() => {
                            props.ondelete(props.row);
                        }}
                    >
                        <InlineIcon icon="trash3-fill" />
                        <span style:margin-left="0.5em">Delete</span>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </MouseBlocker>
    </div>
{/if}
