import { onDestroy } from 'svelte';
import { addMethod, MixedSchema, type AnySchema } from 'yup';
import { ErrorCode } from './api/responses';
import { RequestError } from './api/errors';
import deelEqual from 'deep-equal';

export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
    ? ElementType
    : never;

export class Timer {
    timer: ReturnType<typeof setInterval & typeof setTimeout> | null;

    constructor(
        callback: () => void,
        delay: number,
        private loop: boolean = false,
    ) {
        this.timer = (loop ? setInterval : setTimeout)(callback, delay);

        onDestroy(this.destroy.bind(this));
    }

    destroy() {
        if (this.timer) {
            (this.loop ? clearInterval : clearTimeout)(this.timer);
            this.timer = null;
        }
    }
}

export function formatDuration(time: number) {
    const days = Math.floor(time / 86400);
    const hours = Math.floor((time % 86400) / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    const withoutDays = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (days >= 1) {
        return `${days.toString()} day${days === 1 ? '' : 's'}, ${withoutDays}`;
    } else {
        return withoutDays;
    }
}

export function filterInPlace<T>(array: T[], condition: (value: T, index: number, array: T[]) => boolean) {
    let filtered = 0;

    array.forEach((element, index) => {
        if (condition(element, index, array)) {
            if (index !== filtered) {
                array[filtered] = element;
            }
            filtered++;
        }
    });

    array.length = filtered;
    return array;
}

export interface ErrorMetadata {
    code: ErrorCode;
    message: string;
    extra: object | null;
}

export function extractErrorInfo(err: unknown): ErrorMetadata {
    if (err instanceof RequestError) {
        return { code: err.code, message: err.message, extra: err.extra };
    } else {
        return {
            code: ErrorCode.UnknownError,
            message: err instanceof Error ? err.message : 'Unknown error',
            extra: null,
        };
    }
}

export function resolved<T = void>(value: T): Promise<T> {
    return new Promise<T>((resolve) => {
        resolve(value);
    });
}

export class ChangesTracker<T> {
    constructor(
        private callback: (old: T, value: T) => void,
        private value: T,
        private comparison: 'deep' | 'simple' = 'deep',
    ) {}

    set(value: T) {
        if (
            (this.comparison === 'deep' && !deelEqual(value, this.value)) ||
            (this.comparison === 'simple' && value !== this.value)
        ) {
            const old = this.value;
            this.value = value;
            this.callback(old, value);
        }
    }

    forceUpdate(value: T) {
        const old = this.value;
        this.value = value;
        this.callback(old, value);
    }
}

declare module 'yup' {
    interface MixedSchema {
        oneOfSchemas<T>(schemas: AnySchema[]): MixedSchema<T>;
    }
}

export const oneOfSchemas: Parameters<typeof addMethod> = [
    MixedSchema,
    'oneOfSchemas',
    function (schemas: AnySchema[]) {
        return (this as AnySchema).when(
            (_, __, options) => schemas.find((one) => one.isValidSync(options.value)) ?? schemas[0],
        );
    },
];

addMethod(...oneOfSchemas);
