<script lang="ts" generics="T extends LocalEntity<RemoteEntityData, never, never>">
    import type { LocalEntity, RemoteEntityData } from '$lib/provider.svelte';
    import { ButtonGroup, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from '@sveltestrap/sveltestrap';
    import InlineIcon from './InlineIcon.svelte';
    import IconButton from './IconButton.svelte';
    import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg';
    import type { Props } from './StateControlButtons';

    const {
        startTooltip = 'Start',
        restartTooltip = 'Restart',
        stopTooltip = 'Stop',
        deleteTooltip = 'Delete',

        startIcon = 'play-fill',
        restartIcon = 'arrow-clockwise',
        stopIcon = 'stop-circle',
        deleteIcon = 'trash3-fill',

        size = '3em',
        variant = 'primary',
        ...props
    }: Props<T> = $props();
</script>

<div class="d-flex gap-2">
    <ButtonGroup>
        <IconButton
            icon={startIcon}
            tooltip={startTooltip}
            {size}
            {variant}
            disabled={!props.entity.canStart}
            onclick={props.entity.start.bind(props.entity)}
        />
        <IconButton
            icon={restartIcon}
            tooltip={restartTooltip}
            {size}
            {variant}
            disabled={!props.entity.canRestart}
            onclick={props.entity.restart.bind(props.entity)}
        />
        <IconButton
            icon={stopIcon}
            tooltip={stopTooltip}
            {size}
            {variant}
            disabled={!props.entity.canStop}
            onclick={props.entity.stop.bind(props.entity)}
        />
    </ButtonGroup>
    <Dropdown>
        <DropdownToggle style={`width: ${size}; height: ${size}; padding: 0; display: block`} color={variant}>
            <svg class="bi" fill="currentColor" style="width: 70%; height: 70%; margin: 15%">
                <use xlink:href={`${bootstrapIcons}#list`} />
            </svg>
        </DropdownToggle>
        <DropdownMenu>
            {@render props.menuTop?.()}
            <DropdownItem onclick={props.entity.start.bind(props.entity)} disabled={!props.entity.canStart}>
                <InlineIcon icon={startIcon} />
                <span style:margin-left="0.5em">{startTooltip}</span>
            </DropdownItem>
            <DropdownItem onclick={props.entity.restart.bind(props.entity)} disabled={!props.entity.canRestart}>
                <InlineIcon icon={restartIcon} />
                <span style:margin-left="0.5em">{restartTooltip}</span>
            </DropdownItem>
            <DropdownItem onclick={props.entity.stop.bind(props.entity)} disabled={!props.entity.canStop}>
                <InlineIcon icon={stopIcon} />
                <span style:margin-left="0.5em">{stopTooltip}</span>
            </DropdownItem>
            <DropdownItem divider />
            <DropdownItem onclick={() => props.ondelete?.(props.entity)} disabled={!props.entity.canDelete}>
                <InlineIcon icon={deleteIcon} />
                <span style:margin-left="0.5em">{deleteTooltip}</span>
            </DropdownItem>
            {@render props.menuBottom?.()}
        </DropdownMenu>
    </Dropdown>
</div>
