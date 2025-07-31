import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class MaxNode extends AnyArityMathOpNode {
    constructor(props: NodeProps) {
        super(MaxNode.name(), props);
    }

    clone() {
        return new MaxNode(this.props);
    }

    static name() {
        return 'Max';
    }

    static default(props: NodeProps) {
        return new MaxNode(props);
    }
}
