import { GraphLogNodeData } from '../../../../api/dtos.gen';
import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class LogNode extends UnaryMathOpNode<GraphLogNodeData> {
    type = 'log' as const;

    constructor(props: NodeProps) {
        super(LogNode.name(), { }, props);
    }

    static name() {
        return 'Natural Logarithm (base e)';
    }

    static default(props: NodeProps) {
        return new LogNode(props);
    }
}
