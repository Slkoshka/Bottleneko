import type { LocalEntity, RemoteEntityData } from '$lib/provider.svelte';
import type { Snippet } from 'svelte';

export interface Props<T extends LocalEntity<RemoteEntityData, never, never>> {
    entity: T;

    startTooltip?: string;
    restartTooltip?: string;
    stopTooltip?: string;
    deleteTooltip?: string;

    startIcon?: string;
    restartIcon?: string;
    stopIcon?: string;
    deleteIcon?: string;

    ondelete?: (entity: T) => void;

    size?: string;
    variant?: ButtonStyleVariant;

    menuTop?: Snippet;
    menuBottom?: Snippet;
}
