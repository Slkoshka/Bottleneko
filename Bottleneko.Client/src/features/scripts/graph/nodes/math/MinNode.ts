import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class MinNode extends AnyArityMathOpNode {
    constructor(props: NodeProps) {
        super(MinNode.name(), props);
    }

    clone() {
        return new MinNode(this.props);
    }

    static name() {
        return 'Min';
    }

    static default(props: NodeProps) {
        return new MinNode(props);
    }
}
