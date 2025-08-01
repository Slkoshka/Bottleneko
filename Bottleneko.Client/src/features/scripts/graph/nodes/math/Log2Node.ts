import { GraphLog2NodeData } from '../../../../api/dtos.gen';
import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class Log2Node extends UnaryMathOpNode<GraphLog2NodeData> {
    type = 'log2' as const;

    constructor(props: NodeProps) {
        super(Log2Node.name(), { }, props);
    }

    static name() {
        return 'Binary Logarithm (base 2)';
    }

    static default(props: NodeProps) {
        return new Log2Node(props);
    }
}
