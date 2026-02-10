import type { ScriptCode } from '$lib/api/bottleneko.gen';
import * as yup from 'yup';
import '$lib'; // for yup.mixed().oneOfSchemas

export const EditedScriptSchema = yup.object().shape({
    name: yup.string().default('').required('Name cannot be empty'),
    description: yup.string().default(''),
    code: yup.mixed().oneOfSchemas<ScriptCode>([
        yup.object().shape({
            $type: yup.string().default('JavaScript'),
            source: yup.string(),
        }),
        yup.object().shape({
            $type: yup.string().default('Graph'),
            data: yup.string(),
        }),
    ]),
});

export type EditedScript = yup.InferType<typeof EditedScriptSchema>;

export interface Props {
    id?: string;
    script: EditedScript;
    onsaved: (script: EditedScript) => Promise<void>;
}
