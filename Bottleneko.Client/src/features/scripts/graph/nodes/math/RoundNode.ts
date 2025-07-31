import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class RoundNode extends UnaryMathOpNode {
    constructor(props: NodeProps) {
        super(RoundNode.name(), props);
    }

    clone() {
        return new RoundNode(this.props);
    }

    static name() {
        return 'Round';
    }

    static default(props: NodeProps) {
        return new RoundNode(props);
    }
}
