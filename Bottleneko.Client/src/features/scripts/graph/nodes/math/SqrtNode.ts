import { GraphSqrtNodeData } from '../../../../api/dtos.gen';
import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class SqrtNode extends UnaryMathOpNode<GraphSqrtNodeData> {
    type = 'sqrt' as const;

    constructor(props: NodeProps) {
        super(SqrtNode.name(), { }, props);
    }

    static name() {
        return 'Square Root';
    }

    static default(props: NodeProps) {
        return new SqrtNode(props);
    }
}
