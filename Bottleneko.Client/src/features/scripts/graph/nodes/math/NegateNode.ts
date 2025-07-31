import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class NegateNode extends UnaryMathOpNode {
    constructor(props: NodeProps) {
        super(NegateNode.name(), props);
    }

    clone() {
        return new NegateNode(this.props);
    }

    static name() {
        return 'Negate';
    }

    static default(props: NodeProps) {
        return new NegateNode(props);
    }
}
