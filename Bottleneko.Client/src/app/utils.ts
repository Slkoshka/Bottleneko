import { FC, ReactNode } from 'react';
import { RequestError } from '../features/api/errors';
import { ErrorCode } from '../features/api/responses';

export function formatDuration(time: number) {
    const days = Math.floor(time / 86400);
    const hours = Math.floor((time % 86400) / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    const withoutDays = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (days >= 1) {
        return `${days.toString()} day${days === 1 ? '' : 's'}, ${withoutDays}`;
    }
    else {
        return withoutDays;
    }
}

export interface ErrorMetadata {
    code: ErrorCode;
    message: string;
    extra: object | null;
}

export function extractErrorInfo(err: unknown): ErrorMetadata {
    if (err instanceof RequestError) {
        return { code: err.code, message: err.message, extra: err.extra };
    }
    else {
        return { code: ErrorCode.UnknownError, message: err instanceof Error ? err.message : 'Unknown error', extra: null };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function splitChildren(children: ReactNode | undefined, categories: (FC<any>[] | FC<any>)[]): ReactNode[][] {
    const childList = children === undefined ? [] : typeof children === 'object' && typeof (children as Iterable<ReactNode>)[Symbol.iterator] === 'function' ? [...(children as Iterable<ReactNode>)] : [children];
    const unclaimedChildren = new Set(childList);

    const childrenByCategory = categories.map(category => childList.filter((child) => {
        if (typeof child !== 'object') {
            return false;
        }

        const childType = (child as { type: unknown }).type;
        if (typeof childType !== 'function') {
            return false;
        }

        if (Array.isArray(category)) {
            if (category.includes(childType as FC)) {
                return true;
            }
        }
        else if (category === childType) {
            return true;
        }

        return false;
    }));

    for (const category of childrenByCategory) {
        for (const child of category) {
            unclaimedChildren.delete(child);
        }
    }

    childrenByCategory.push([...unclaimedChildren]);
    return childrenByCategory;
}
