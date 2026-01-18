import type { Snippet } from 'svelte';
import type { MouseEventHandler } from 'svelte/elements';

export type Props = {
    icon: string;
    tooltip: Snippet | string | null;
    size?: string;
    variant?: ButtonStyleVariant;
    style?: string;
    disabled?: boolean;
    href?: string;
    onclick?: MouseEventHandler<HTMLElement>;
};
