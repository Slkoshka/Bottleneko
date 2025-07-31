import { NekoControl, NekoControlProps } from './NekoControl';

export interface NekoInputControlProps<T> extends NekoControlProps {
    initial: T;
    fastUpdate?: boolean;
    change?: (value: T) => void;
}

export abstract class NekoInputControl<T> extends NekoControl {
    value: T;
    readonly initial: T;
    fastUpdate: boolean;

    constructor(readonly props: NekoInputControlProps<T>) {
        super(props);

        this.value = this.initial = props.initial;
        this.fastUpdate = props.fastUpdate ?? false;
    }

    setValue(value?: T) {
        this.value = value ?? this.initial;
        this.props.change?.(this.value);
    }
}
