import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class SignNode extends UnaryMathOpNode {
    constructor(props: NodeProps) {
        super(SignNode.name(), props);
    }

    clone() {
        return new SignNode(this.props);
    }

    static name() {
        return 'Sign';
    }

    static default(props: NodeProps) {
        return new SignNode(props);
    }
}
