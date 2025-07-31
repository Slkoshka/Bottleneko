import { NekoInputControl, NekoInputControlProps } from './NekoInputControl';

export interface TextInputControlProps extends NekoInputControlProps<string> {
    maxLength?: number;
}

export class TextInputControl extends NekoInputControl<string> {
    maxLength?: number;

    constructor(props: TextInputControlProps) {
        super(props);

        this.maxLength = props.maxLength;
    }
}
