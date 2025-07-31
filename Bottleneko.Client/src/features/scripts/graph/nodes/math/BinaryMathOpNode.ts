import { ClassicPreset } from 'rete';
import { NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';

export interface BinaryMathOpNodeCustomization {
    leftName?: string;
    rightName?: string;
    outName?: string;
}

export abstract class BinaryMathOpNode<Props extends NodeProps = NodeProps> extends NekoNodeBase<
    {
        left: NumberSocket;
        right: NumberSocket;
    },
    {
        out: NumberSocket;
    },
    object,
    Props
> {
    constructor(name: string, props: Props, customization?: BinaryMathOpNodeCustomization) {
        super(name, props);

        // Inputs
        this.addInput('left', new ClassicPreset.Input(new NumberSocket(), customization?.leftName ?? 'Left', false));
        this.addInput('right', new ClassicPreset.Input(new NumberSocket(), customization?.rightName ?? 'Right', false));

        // Outputs
        this.addOutput('out', new ClassicPreset.Output(new NumberSocket(), customization?.outName ?? 'Out', true));

        // Controls
    }
}
