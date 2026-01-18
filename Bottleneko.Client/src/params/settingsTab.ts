import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): param is 'network' | 'users' | 'logs' => {
    return param === 'network' || param === 'users' || param === 'logs';
}) satisfies ParamMatcher;
