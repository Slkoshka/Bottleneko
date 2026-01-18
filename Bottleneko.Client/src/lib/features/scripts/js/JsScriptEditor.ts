import type { ScriptCode } from '$lib/api/dtos.gen';

export interface Props {
    initialCode?: string;
    onchange?: (code: ScriptCode) => void;
}
