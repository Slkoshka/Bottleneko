import { NodeProps } from '../NekoNodeBase';
import { BinaryMathOpNode } from './BinaryMathOpNode';

export class RemainderNode extends BinaryMathOpNode {
    constructor(props: NodeProps) {
        super(RemainderNode.name(), props);
    }

    clone() {
        return new RemainderNode(this.props);
    }

    static name() {
        return 'Remainder';
    }

    static default(props: NodeProps) {
        return new RemainderNode(props);
    }
}
