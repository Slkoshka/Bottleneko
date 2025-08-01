import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class LogNode extends UnaryMathOpNode {
    type = 'log';

    constructor(props: NodeProps) {
        super(LogNode.name(), props);
    }

    static name() {
        return 'Natural Logarithm (base e)';
    }

    static default(props: NodeProps) {
        return new LogNode(props);
    }
}
