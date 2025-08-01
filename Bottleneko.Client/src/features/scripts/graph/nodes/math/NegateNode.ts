import { GraphNegateNodeData } from '../../../../api/dtos.gen';
import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class NegateNode extends UnaryMathOpNode<GraphNegateNodeData> {
    type = 'negate' as const;

    constructor(props: NodeProps) {
        super(NegateNode.name(), { }, props);
    }

    static name() {
        return 'Negate';
    }

    static default(props: NodeProps) {
        return new NegateNode(props);
    }
}
