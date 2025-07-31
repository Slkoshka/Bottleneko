import { NodeProps } from '../NekoNodeBase';
import { BinaryMathOpNode } from './BinaryMathOpNode';

export class PowerNode extends BinaryMathOpNode {
    constructor(props: NodeProps) {
        super(PowerNode.name(), props, { leftName: 'Base', rightName: 'Power' });
    }

    clone() {
        return new PowerNode(this.props);
    }

    static name() {
        return 'Power';
    }

    static default(props: NodeProps) {
        return new PowerNode(props);
    }
}
