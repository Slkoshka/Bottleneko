import type { Component } from 'svelte';

export type SetupPageStage =
    | { id: 'welcome' }
    | { id: 'account' }
    | { id: 'initializing'; login: string; password: string }
    | { id: 'initialization-error'; error: object }
    | { id: 'finish'; accessToken: string };

export interface SetupPageViewProps {
    onstagechange: (stage: SetupPageStage) => void;
}

export type SetupPageView = ReturnType<Component<SetupPageViewProps, { submit?: () => void }>>;
