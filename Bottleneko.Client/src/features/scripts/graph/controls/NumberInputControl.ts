import { NekoInputControl, NekoInputControlProps } from './NekoInputControl';

export interface NumberInputControlProps extends NekoInputControlProps<number> {
    min?: number;
    max?: number;
}

export class NumberInputControl extends NekoInputControl<number> {
    min?: number;
    max?: number;

    constructor(props: NumberInputControlProps) {
        super(props);

        this.min = props.min;
        this.max = props.max;
    }
}
