import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class MultiplyNode extends AnyArityMathOpNode {
    type = 'multiply';

    constructor(props: NodeProps) {
        super(MultiplyNode.name(), props);
    }

    static name() {
        return 'Multiply';
    }

    static default(props: NodeProps) {
        return new MultiplyNode(props);
    }
}
