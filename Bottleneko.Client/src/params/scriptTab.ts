import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): param is 'logs' | 'edit' => {
    return param === 'logs' || param === 'edit';
}) satisfies ParamMatcher;
