import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class Log2Node extends UnaryMathOpNode {
    type = 'log2';

    constructor(props: NodeProps) {
        super(Log2Node.name(), props);
    }

    static name() {
        return 'Binary Logarithm (base 2)';
    }

    static default(props: NodeProps) {
        return new Log2Node(props);
    }
}
