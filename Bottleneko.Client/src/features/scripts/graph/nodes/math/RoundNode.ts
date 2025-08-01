import { GraphRoundNodeData } from '../../../../api/dtos.gen';
import { NodeProps } from '../NekoNodeBase';
import { UnaryMathOpNode } from './UnaryMathOpNode';

export class RoundNode extends UnaryMathOpNode<GraphRoundNodeData> {
    type = 'round' as const;

    constructor(props: NodeProps) {
        super(RoundNode.name(), { }, props);
    }

    static name() {
        return 'Round';
    }

    static default(props: NodeProps) {
        return new RoundNode(props);
    }
}
