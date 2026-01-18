import type { Snippet } from 'svelte';

export interface Props {
    id: string;
    title?: Snippet | string;
    icon?: string;
    children?: Snippet;
    default?: boolean;
}
