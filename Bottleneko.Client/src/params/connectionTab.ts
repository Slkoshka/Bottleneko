import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): param is 'messages' | 'logs' | 'parameters' => {
    return param === 'messages' || param === 'logs' || param === 'parameters';
}) satisfies ParamMatcher;
