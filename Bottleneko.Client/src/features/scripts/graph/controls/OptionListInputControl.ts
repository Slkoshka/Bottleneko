import { ClassicPreset } from 'rete';

export interface OptionListInputControlProps<T> {
    initial: T;
    change?: (value: T) => void;
}

export abstract class OptionListInputControl<T> extends ClassicPreset.Control {
    value: T;
    readonly initial: T;

    constructor(readonly props: OptionListInputControlProps<T>) {
        super();

        this.value = this.initial = props.initial;
    }

    setValue(value?: T) {
        this.value = value ?? this.initial;
        this.props.change?.(this.value);
    }

    abstract options(): { name: string; value: T }[];
}
