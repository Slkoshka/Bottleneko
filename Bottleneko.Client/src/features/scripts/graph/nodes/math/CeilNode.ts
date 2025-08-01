import { GraphCeilNodeData } from '../../../../api/dtos.gen';
import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class CeilNode extends UnaryMathOpNode<GraphCeilNodeData> {
    type = 'ceil' as const;

    constructor(props: NodeProps) {
        super(CeilNode.name(), { }, props);
    }

    static name() {
        return 'Round Up';
    }

    static default(props: NodeProps) {
        return new CeilNode(props);
    }
}
