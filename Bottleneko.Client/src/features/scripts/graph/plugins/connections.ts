import { ClassicFlow, ClassicParams, Context, PickParams } from 'rete-connection-plugin';
import { Schemes } from '../editor';

interface Params extends ClassicParams<Schemes> {
    connectionPicked: () => void;
}

export class ConnectionFlow extends ClassicFlow<Schemes, never[]> {
    connectionPicked?: () => void;

    constructor(params?: Partial<Params>) {
        super(params);

        this.connectionPicked = params?.connectionPicked;
    }

    pick(params: PickParams, context: Context<Schemes, never[]>): Promise<void> {
        this.connectionPicked?.();
        return super.pick(params, context);
    }
}
