import { NekoInputControl, NekoInputControlProps } from './NekoInputControl';

export type OptionListInputControlProps<T> = NekoInputControlProps<T>;

export abstract class OptionListInputControl<T> extends NekoInputControl<T> {
    constructor(readonly props: OptionListInputControlProps<T>) {
        super(props);
    }

    abstract options(): { name: string; value: T }[];
}
