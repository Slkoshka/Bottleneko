import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class MaxNode extends AnyArityMathOpNode {
    type = 'max';

    constructor(props: NodeProps) {
        super(MaxNode.name(), props);
    }

    static name() {
        return 'Max';
    }

    static default(props: NodeProps) {
        return new MaxNode(props);
    }
}
