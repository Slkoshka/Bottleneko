import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class SqrtNode extends UnaryMathOpNode {
    constructor(props: NodeProps) {
        super(SqrtNode.name(), props);
    }

    clone() {
        return new SqrtNode(this.props);
    }

    static name() {
        return 'Square Root';
    }

    static default(props: NodeProps) {
        return new SqrtNode(props);
    }
}
