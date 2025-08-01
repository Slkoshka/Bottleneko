import { GraphPowerNodeData } from '../../../../api/dtos.gen';
import { NodeProps } from '../NekoNodeBase';
import { BinaryMathOpNode } from './BinaryMathOpNode';

export class PowerNode extends BinaryMathOpNode<GraphPowerNodeData> {
    type = 'power' as const;

    constructor(props: NodeProps) {
        super(PowerNode.name(), { }, props, { leftName: 'Base', rightName: 'Power' });
    }

    static name() {
        return 'Power';
    }

    static default(props: NodeProps) {
        return new PowerNode(props);
    }
}
