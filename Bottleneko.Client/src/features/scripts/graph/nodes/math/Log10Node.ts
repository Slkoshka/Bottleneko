import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class Log10Node extends UnaryMathOpNode {
    type = 'log10';

    constructor(props: NodeProps) {
        super(Log10Node.name(), props);
    }

    static name() {
        return 'Decimal Logarithm (base 10)';
    }

    static default(props: NodeProps) {
        return new Log10Node(props);
    }
}
