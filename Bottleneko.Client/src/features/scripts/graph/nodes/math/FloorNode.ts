import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class FloorNode extends UnaryMathOpNode {
    type = 'floor';

    constructor(props: NodeProps) {
        super(FloorNode.name(), props);
    }

    static name() {
        return 'Round Down';
    }

    static default(props: NodeProps) {
        return new FloorNode(props);
    }
}
