import { GraphMultiplyNodeData } from '../../../../api/dtos.gen';
import { NodeProps } from '../NekoNodeBase';
import { AnyArityMathOpNode } from './AnyArityMathOpNode';

export class MultiplyNode extends AnyArityMathOpNode<GraphMultiplyNodeData> {
    type = 'multiply' as const;

    constructor(props: NodeProps) {
        super(MultiplyNode.name(), { }, props);
    }

    static name() {
        return 'Multiply';
    }

    static default(props: NodeProps) {
        return new MultiplyNode(props);
    }
}
