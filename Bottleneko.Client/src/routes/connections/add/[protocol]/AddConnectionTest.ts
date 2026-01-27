import type { ConnectionDefinition } from '$lib/features/connections';
import type { AddConnectionStage } from '.';
import { type Protocol } from '$lib/api/bottleneko.gen';

export interface Props {
    protocol: Protocol;
    definition: ConnectionDefinition;
    onstagechange?: (stage: AddConnectionStage) => void;
}
