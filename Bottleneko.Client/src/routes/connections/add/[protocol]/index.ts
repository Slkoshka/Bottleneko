import type { Protocol } from '$lib/api/dtos.gen';
import type { ConnectionDefinition } from '$lib/features/connections';

export type AddConnectionStage =
    | { id: 'config'; protocol: Protocol; definition: ConnectionDefinition | null }
    | { id: 'test' | 'finish'; protocol: Protocol; definition: ConnectionDefinition };
