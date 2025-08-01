import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class SignNode extends UnaryMathOpNode {
    type = 'sign';

    constructor(props: NodeProps) {
        super(SignNode.name(), props);
    }

    static name() {
        return 'Sign';
    }

    static default(props: NodeProps) {
        return new SignNode(props);
    }
}
