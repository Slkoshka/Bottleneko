<script lang="ts">
    import { page } from '$app/state';
    import { resolve } from '$app/paths';
    import { authState, logout } from '$lib/features/auth.svelte';
    import InlineIcon from '$lib/components/InlineIcon.svelte';
    import { brand } from '$lib/props';
    import {
        Dropdown,
        DropdownItem,
        DropdownMenu,
        DropdownToggle,
        Nav,
        NavItem,
        NavLink,
        Spinner,
    } from '@sveltestrap/sveltestrap';
    import { Connections } from '$lib/features/connections';
    import ProtocolIcon from '$lib/features/connections/ProtocolIcon.svelte';
    import ConnectionStatusIcon from '$lib/features/connections/ConnectionStatusIcon.svelte';
    import IconButton from '$lib/components/IconButton.svelte';
    import { LocalConnection } from '$lib/features/connections/provider.svelte';

    const match = (
        route: ReturnType<typeof resolve> | ReturnType<typeof resolve>[],
        options?: { exact?: boolean; filter?: (params: typeof page.params) => boolean },
    ): boolean => {
        const opt = {
            exact: false,
            filter: () => true,
            ...options,
        };

        if (page.route.id === null) {
            return false;
        }

        if (typeof route === 'string') {
            return (
                (page.route.id === route ||
                    (!opt.exact && page.route.id.startsWith(route.endsWith('/') ? route : route + '/'))) &&
                opt.filter(page.params)
            );
        } else {
            return route.reduce((prev, cur) => prev || match(cur, opt), false);
        }
    };

    $effect(() => {
        void page.url;
        document.querySelector('body')?.classList.remove('sidebar-shown');
    });
</script>

{#snippet button(
    text: string,
    dest: Extract<Parameters<typeof match>[0], string>,
    icon: string | null,
    matches?: { routes?: Parameters<typeof match>[0]; options?: Parameters<typeof match>[1] },
)}
    {@const isMatch = match(matches?.routes === undefined ? dest : matches.routes, matches?.options)}
    <NavItem>
        <NavLink href={dest} active={isMatch} class="text-white fs-5 fw-bold">
            {#if icon !== null}
                <span class="me-1"><InlineIcon {icon} /></span>
            {/if}
            {text}
        </NavLink>
    </NavItem>
{/snippet}

{#snippet buttonWithAdd(
    text: string,
    dest: Extract<Parameters<typeof match>[0], string>,
    addDest: string,
    addTooltip: string,
    icon: string | null,
    matches?: { routes?: Parameters<typeof match>[0]; options?: Parameters<typeof match>[1] },
)}
    <!-- eslint-disable @typescript-eslint/no-unnecessary-type-assertion -->
    {@const isMatch = match(
        matches?.routes === undefined
            ? [dest, addDest as Extract<Parameters<typeof match>[0], string>]
            : matches.routes,
        matches?.options,
    )}
    <NavItem>
        <NavLink href={dest} active={isMatch} class="d-flex">
            <span class="flex-grow-1 text-white fs-5 fw-bold">
                {#if icon !== null}
                    <span class="me-1"><InlineIcon {icon} /></span>
                {/if}
                {text}
            </span>

            <IconButton href={addDest} icon="plus-lg" tooltip={addTooltip} variant={isMatch ? 'light' : 'primary'} />
        </NavLink>
    </NavItem>
{/snippet}

{#snippet connectionButton(connection: LocalConnection)}
    {@const isMatch = match('/connections/[connectionId]', {
        filter: (params) => params.connectionId === connection.data.id,
    })}
    <NavItem class="w-100">
        <NavLink
            href={resolve('/connections/[connectionId]', { connectionId: connection.data.id })}
            active={isMatch}
            class="text-white fs-6"
        >
            <div class="d-flex align-items-center" style:gap="1rem">
                <div class="flex-shrink-0 mt-0">
                    <ProtocolIcon protocol={connection.data.protocol} size="2em" />
                </div>
                <span class="flex-grow-1 text-collapse">{connection.data.name}</span>
                <div class="flex-shrink-0">
                    <ConnectionStatusIcon status={connection.data.extendedStatus} />
                </div>
            </div>
        </NavLink>
    </NavItem>
{/snippet}

<aside class="d-flex flex-column p-3 shadow" style:background-color="#171717">
    <a href={resolve('/')} class="text-white text-decoration-none brand">
        <span style:font-size="2rem" style:font-weight="bold">
            {#each brand.formatted as element (element)}
                <span class:brand-highlight={element.highlighted}>{element.text}</span>
            {/each}
        </span>

        <div class="sidebar-button float-end">
            <IconButton
                icon="list"
                tooltip={null}
                variant="outline-secondary"
                style="width: 3em; height: 3em"
                onclick={(e: MouseEvent) => {
                    document.querySelector('body')?.classList.toggle('sidebar-shown');
                    e.preventDefault();
                }}
            />
        </div>
    </a>

    <hr />

    <Nav pills class="d-flex flex-column">
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render button('Dashboard', resolve('/'), 'collection', { options: { exact: true } })}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render button('Messages', resolve('/messages'), 'chat-left-text')}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render buttonWithAdd(
            'Connections',
            resolve('/connections'),
            resolve('/connections/add'),
            'Add a new connection',
            'wifi',
            {
                options: { exact: true },
            },
        )}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render buttonWithAdd(
            'Scripting',
            resolve('/scripts'),
            resolve('/scripts/add'),
            'Create a new script',
            'braces',
            {
                options: { exact: true },
            },
        )}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render button('Settings', resolve('/settings'), 'tools')}
    </Nav>

    <Nav pills class="d-flex mt-auto">
        {#if Connections.provider?.list}
            {#each Connections.provider.list as connection (connection.data.id)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
                {@render connectionButton(connection)}
            {/each}
        {:else}
            <Spinner type="border" class="my-4 mx-auto" />
        {/if}
    </Nav>

    <hr />

    <Dropdown>
        <DropdownToggle tag="span" class="d-flex align-items-center text-white text-decoration-none dropdown-toggle">
            <span class="menu-toggle">Logged in as <strong>{authState.data.me?.displayName ?? '?'}</strong></span>
        </DropdownToggle>

        <DropdownMenu color="dark" class="shadow">
            <DropdownItem onclick={logout}>
                <InlineIcon icon="person" />
                <span style:margin-left="0.5em">Sign out</span>
            </DropdownItem>
        </DropdownMenu>
    </Dropdown>
</aside>

<style lang="scss">
    @import '../vars.scss';

    .brand {
        span {
            display: block;
            float: left;
        }

        .brand-highlight {
            color: $primary;
            transform: translateY(0.1em);
        }
    }

    .menu-toggle {
        user-select: none;
        cursor: pointer;
    }

    aside {
        position: fixed;
        top: 0;
        left: 0;
        width: 25rem;
        height: 100dvh;
        overflow-y: auto;
    }

    @media only screen and (max-width: $small-screen-width) {
        aside {
            width: max(20rem, 20vw);
        }
    }

    @media only screen and (max-width: $mobile-view-width) {
        aside {
            width: 100dvw;
            height: 5rem;
            z-index: 100;
            overflow-y: hidden;
            overscroll-behavior-y: contain;
        }
    }
</style>
