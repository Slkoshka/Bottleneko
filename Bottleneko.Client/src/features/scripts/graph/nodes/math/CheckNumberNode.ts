import { ClassicPreset } from 'rete';
import { BooleanSocket, NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';

export interface UnaryMathOpNodeCustomization {
    inName?: string;
    outName?: string;
}

export class CheckNumberNode extends NekoNodeBase<
    {
        in: NumberSocket;
    },
    {
        isPositiveInfinity: BooleanSocket;
        isNegativeInfinity: BooleanSocket;
        isNaN: BooleanSocket;
    },
    object
> {
    type = 'check-number';
    category = 'math' as const;

    constructor(props: NodeProps) {
        super(CheckNumberNode.name(), { }, props);

        // Inputs
        this.addInput('in', new ClassicPreset.Input(new NumberSocket(), 'In', false));

        // Outputs
        this.addOutput('isPositiveInfinity', new ClassicPreset.Output(new BooleanSocket(), 'Is Positive Infinity', true));
        this.addOutput('isNegativeInfinity', new ClassicPreset.Output(new BooleanSocket(), 'Is Negative Infinity', true));
        this.addOutput('isNaN', new ClassicPreset.Output(new BooleanSocket(), 'Is NaN', true));

        // Controls
    }

    static name() {
        return 'Check Number';
    }

    static default(props: NodeProps) {
        return new CheckNumberNode(props);
    }
}
