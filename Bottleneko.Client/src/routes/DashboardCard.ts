import type { Snippet } from 'svelte';

export interface Props {
    title?: Snippet | string;
    children?: Snippet;
    class?: string;
    style?: string;
}
