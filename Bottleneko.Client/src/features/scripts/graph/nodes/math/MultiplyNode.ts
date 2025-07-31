import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class MultiplyNode extends AnyArityMathOpNode {
    constructor(props: NodeProps) {
        super(MultiplyNode.name(), props);
    }

    clone() {
        return new MultiplyNode(this.props);
    }

    static name() {
        return 'Multiply';
    }

    static default(props: NodeProps) {
        return new MultiplyNode(props);
    }
}
