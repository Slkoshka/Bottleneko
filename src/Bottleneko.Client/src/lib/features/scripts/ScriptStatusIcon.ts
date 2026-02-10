import type { ScriptStatus } from '$lib/api/bottleneko.gen';

export interface Props {
    status: ScriptStatus;
    'show-label'?: boolean;
    size?: string;
}
