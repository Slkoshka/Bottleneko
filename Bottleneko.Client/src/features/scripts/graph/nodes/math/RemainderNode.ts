import { NodeProps } from '../NekoNodeBase';
import { BinaryMathOpNode } from './BinaryMathOpNode';

export class RemainderNode extends BinaryMathOpNode {
    type = 'remainder';

    constructor(props: NodeProps) {
        super(RemainderNode.name(), props);
    }

    static name() {
        return 'Remainder';
    }

    static default(props: NodeProps) {
        return new RemainderNode(props);
    }
}
