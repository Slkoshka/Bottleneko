import { NodeProps } from '../NekoNodeBase';
import { BinaryMathOpNode } from './BinaryMathOpNode';

export class SubtractNode extends BinaryMathOpNode {
    type = 'subtract';

    constructor(props: NodeProps) {
        super(SubtractNode.name(), props);
    }

    static name() {
        return 'Subtract';
    }

    static default(props: NodeProps) {
        return new SubtractNode(props);
    }
}
