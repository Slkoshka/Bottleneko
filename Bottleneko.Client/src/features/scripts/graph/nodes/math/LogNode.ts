import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class LogNode extends UnaryMathOpNode {
    constructor(props: NodeProps) {
        super(LogNode.name(), props);
    }

    clone() {
        return new LogNode(this.props);
    }

    static name() {
        return 'Natural Logarithm (base e)';
    }

    static default(props: NodeProps) {
        return new LogNode(props);
    }
}
