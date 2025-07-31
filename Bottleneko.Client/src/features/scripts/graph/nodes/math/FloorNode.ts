import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class FloorNode extends UnaryMathOpNode {
    constructor(props: NodeProps) {
        super(FloorNode.name(), props);
    }

    clone() {
        return new FloorNode(this.props);
    }

    static name() {
        return 'Round Down';
    }

    static default(props: NodeProps) {
        return new FloorNode(props);
    }
}
