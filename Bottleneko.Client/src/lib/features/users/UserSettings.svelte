<script lang="ts">
    import type { UserDto } from '$lib/api/bottleneko.gen';
    import EntityDeletionDialog from '$lib/components/EntityDeletionDialog.svelte';
    import IconButton from '$lib/components/IconButton.svelte';
    import { type TypedDataTable } from '$lib/components/DataTable';
    import DataTable from '$lib/components/DataTable.svelte';
    import { onDestroy } from 'svelte';
    import { UsersProvider, type LocalUser } from '../users/provider.svelte';
    import UserEditor from './UserEditor.svelte';
    import UserListRowRenderer from './UserListRowRenderer.svelte';
    import type { RendererProps, TableType } from './UserSettings';
    let editorState = $state({ shown: false, editing: null as UserDto | null });

    let deletingUser: LocalUser | null = $state(null);
    let isDeleting = $state(false);

    const ondelete = async () => {
        if (deletingUser) {
            try {
                isDeleting = true;
                await users.delete(deletingUser);
            } finally {
                isDeleting = false;
                deletingUser = null;
            }
        }
    };

    let users = new UsersProvider();
    onDestroy(() => {
        users.destroy();
    });

    const UserListTable = DataTable as TypedDataTable<TableType>;
    const rendererProps: RendererProps = (props) => {
        return {
            ...props,
            onedit(user) {
                editorState = { shown: true, editing: user.data };
            },
            ondelete(user) {
                deletingUser = user;
            },
        };
    };
</script>

<UserEditor
    show={editorState.shown}
    user={editorState.editing}
    onsuccess={async (user: UsersProvider['$update']) => {
        if (editorState.editing) {
            const localUser = users.list?.find((p) => p.data.id === editorState.editing?.id);
            if (localUser) {
                await localUser.update({ ...user, password: user.password === '' ? undefined : user.password });
            }
        } else {
            await users.add(user);
        }
        editorState = { shown: false, editing: null };
    }}
    onclose={() => (editorState = { shown: false, editing: editorState.editing })}
/>

<div style:height="500px">
    <EntityDeletionDialog
        item={deletingUser}
        type-name="user"
        loading={isDeleting}
        {ondelete}
        onclose={() => {
            deletingUser = null;
        }}
    />

    <UserListTable
        title="User list"
        highlight-header
        variant="entity-list"
        renderer={UserListRowRenderer}
        {rendererProps}
        columns={{
            id: { header: 'ID', style: 'width: 5em' },
            login: { header: 'Username' },
            displayName: { header: 'Display Name' },
            actions: { header: '', style: 'width: 5em' },
        }}
        rows={users.list?.map((user) => ({
            id: user.data.id,
            onclick: () => {
                editorState = { shown: true, editing: user.data };
            },
            cells: {
                id: {
                    class: 'font-monospace',
                    style: 'vertical-align: middle',
                },
                login: {
                    class: 'font-monospace',
                    style: 'vertical-align: middle',
                },
                displayName: {
                    class: 'text-collapse',
                    style: 'vertical-align: middle',
                },
                actions: {},
            },
            data: user,
        }))}
    >
        {#snippet placeholder()}
            <em class="text-secondary fst-italic">(no users)</em>
        {/snippet}

        {#snippet endHeaderExtra()}
            <IconButton
                icon="plus-lg"
                tooltip="Add user server"
                variant="dark"
                onclick={() => (editorState = { shown: true, editing: null })}
            />
        {/snippet}
    </UserListTable>
</div>
