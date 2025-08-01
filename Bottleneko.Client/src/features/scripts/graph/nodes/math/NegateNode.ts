import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class NegateNode extends UnaryMathOpNode {
    type = 'negate';

    constructor(props: NodeProps) {
        super(NegateNode.name(), props);
    }

    static name() {
        return 'Negate';
    }

    static default(props: NodeProps) {
        return new NegateNode(props);
    }
}
