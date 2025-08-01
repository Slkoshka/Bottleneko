import { ClassicPreset } from 'rete';
import { NumberSocket } from '../../sockets';
import { NekoNodeBase, NodeProps } from '../NekoNodeBase';
import { GraphNodeData } from '../../../../api/dtos.gen';

export interface BinaryMathOpNodeCustomization {
    leftName?: string;
    rightName?: string;
    outName?: string;
}

export abstract class BinaryMathOpNode<Data extends GraphNodeData, Props extends NodeProps = NodeProps> extends NekoNodeBase<
    {
        left: NumberSocket;
        right: NumberSocket;
    },
    {
        out: NumberSocket;
    },
    object,
    Data,
    Props
> {
    category = 'math' as const;

    constructor(name: string, initial: BinaryMathOpNode<Data, Props>['initial'], props: Props, customization?: BinaryMathOpNodeCustomization) {
        super(name, initial, props);

        // Inputs
        this.addInput('left', new ClassicPreset.Input(new NumberSocket(), customization?.leftName ?? 'Left', false));
        this.addInput('right', new ClassicPreset.Input(new NumberSocket(), customization?.rightName ?? 'Right', false));

        // Outputs
        this.addOutput('out', new ClassicPreset.Output(new NumberSocket(), customization?.outName ?? 'Out', true));

        // Controls
    }
}
