import { ClassicPreset } from 'rete';
import { NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';

export interface UnaryMathOpNodeCustomization {
    inName?: string;
    outName?: string;
}

export abstract class UnaryMathOpNode<Props extends NodeProps = NodeProps> extends NekoNodeBase<
    {
        in: NumberSocket;
    },
    {
        out: NumberSocket;
    },
    object,
    Props
> {
    constructor(name: string, props: Props, customization?: UnaryMathOpNodeCustomization) {
        super(name, props);

        // Inputs
        this.addInput('in', new ClassicPreset.Input(new NumberSocket(), customization?.inName ?? 'In', false));

        // Outputs
        this.addOutput('out', new ClassicPreset.Output(new NumberSocket(), customization?.outName ?? 'Out', true));

        // Controls
    }
}
