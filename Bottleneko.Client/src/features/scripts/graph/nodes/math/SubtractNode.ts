import { NodeProps } from '../NekoNodeBase';
import { BinaryMathOpNode } from './BinaryMathOpNode';

export class SubtractNode extends BinaryMathOpNode {
    constructor(props: NodeProps) {
        super(SubtractNode.name(), props);
    }

    clone() {
        return new SubtractNode(this.props);
    }

    static name() {
        return 'Subtract';
    }

    static default(props: NodeProps) {
        return new SubtractNode(props);
    }
}
