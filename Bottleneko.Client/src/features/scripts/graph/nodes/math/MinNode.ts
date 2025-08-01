import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class MinNode extends AnyArityMathOpNode {
    type = 'min';

    constructor(props: NodeProps) {
        super(MinNode.name(), props);
    }

    static name() {
        return 'Min';
    }

    static default(props: NodeProps) {
        return new MinNode(props);
    }
}
