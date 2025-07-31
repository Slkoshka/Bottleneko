import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class Log10Node extends UnaryMathOpNode {
    constructor(props: NodeProps) {
        super(Log10Node.name(), props);
    }

    clone() {
        return new Log10Node(this.props);
    }

    static name() {
        return 'Decimal Logarithm (base 10)';
    }

    static default(props: NodeProps) {
        return new Log10Node(props);
    }
}
