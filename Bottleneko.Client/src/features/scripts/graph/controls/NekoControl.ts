import { ClassicPreset } from 'rete';

export interface NekoControlProps {
    label?: string;
}

export abstract class NekoControl extends ClassicPreset.Control {
    label?: string;
    value?: unknown;

    constructor(props: NekoControlProps) {
        super();

        this.label = props.label;
    }
}
