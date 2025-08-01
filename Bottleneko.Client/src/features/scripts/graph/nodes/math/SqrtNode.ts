import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class SqrtNode extends UnaryMathOpNode {
    type = 'sqrt';

    constructor(props: NodeProps) {
        super(SqrtNode.name(), props);
    }

    static name() {
        return 'Square Root';
    }

    static default(props: NodeProps) {
        return new SqrtNode(props);
    }
}
