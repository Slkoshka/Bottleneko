import { NodeProps } from '../NekoNodeBase';
import { BinaryMathOpNode } from './BinaryMathOpNode';

export class PowerNode extends BinaryMathOpNode {
    type = 'power';

    constructor(props: NodeProps) {
        super(PowerNode.name(), props, { leftName: 'Base', rightName: 'Power' });
    }

    static name() {
        return 'Power';
    }

    static default(props: NodeProps) {
        return new PowerNode(props);
    }
}
