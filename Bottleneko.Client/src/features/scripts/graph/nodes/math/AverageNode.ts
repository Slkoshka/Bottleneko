import { GraphAverageNodeData } from '../../../../api/dtos.gen';
import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class AverageNode extends AnyArityMathOpNode<GraphAverageNodeData> {
    type = 'average' as const;

    constructor(props: NodeProps) {
        super(AverageNode.name(), { }, props);
    }

    static name() {
        return 'Average';
    }

    static default(props: NodeProps) {
        return new AverageNode(props);
    }
}
