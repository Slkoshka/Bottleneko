import { GraphMaxNodeData } from '../../../../api/dtos.gen';
import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class MaxNode extends AnyArityMathOpNode<GraphMaxNodeData> {
    type = 'max' as const;

    constructor(props: NodeProps) {
        super(MaxNode.name(), { }, props);
    }

    static name() {
        return 'Max';
    }

    static default(props: NodeProps) {
        return new MaxNode(props);
    }
}
