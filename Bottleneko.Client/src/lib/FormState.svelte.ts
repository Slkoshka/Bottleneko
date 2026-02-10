import * as yup from 'yup';
import { RequestError } from './api/errors';

export class FormState<Schema extends yup.Schema<object, yup.AnyObject, object>> {
    private schema: Schema;
    data: yup.InferType<Schema>;
    isLoading = $state(false);

    error: string | null = $state(null);
    validationErrors: Record<string, string> = $state({});
    hasErrors = $derived(Object.keys(this.validationErrors).length > 0 || this.error !== null);

    constructor(
        schema: Schema,
        initialValue?: yup.InferType<Schema>,
        private sendCallback?: (data: yup.InferType<Schema>) => Promise<void>,
    ) {
        this.schema = schema;
        this.data = $state(structuredClone($state.snapshot(initialValue ?? this.getDefault()))) as yup.InferType<Schema>;
    }

    async send(data: yup.InferType<Schema>): Promise<void> {
        await this.sendCallback?.(data);
    }

    getDefault(): yup.InferType<Schema> {
        return this.schema.getDefault();
    }

    showError(err: string | null) {
        this.error = err;
    }

    onRequestError(err: unknown) {
        console.error(err);
        if (err instanceof RequestError) {
            this.showError(err.message);
        } else {
            this.showError('Unknown error');
        }
    }

    clearErrors() {
        this.error = null;
        this.validationErrors = {};
    }

    async submit(e?: SubmitEvent) {
        e?.preventDefault();
        e?.stopPropagation();

        this.isLoading = true;
        this.clearErrors();

        try {
            await this.send(await this.schema.validate(this.data, { abortEarly: false }));
        } catch (err: unknown) {
            if (err instanceof yup.ValidationError) {
                this.validationErrors = err.inner.reduce((acc, err) => {
                    if (err.path !== undefined) {
                        return { ...acc, [err.path]: err.message };
                    } else {
                        return acc;
                    }
                }, {});
            } else {
                this.onRequestError(err);
            }
        } finally {
            this.isLoading = false;
        }
    }
}
