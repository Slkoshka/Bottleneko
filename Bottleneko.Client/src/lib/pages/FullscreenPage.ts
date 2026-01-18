import type { Snippet } from 'svelte';

export interface ButtonDefinition {
    children: Snippet | string;
    variant?: ButtonStyleVariant;
    disabled?: boolean;
    size?: StyleSize;
    action?: 'submit' | 'reset' | (() => void);
}

export interface Props {
    title: {
        children: Snippet | string;
        variant?: StyleVariant;
    };
    children: Snippet;
    buttons?: ButtonDefinition[];
}
