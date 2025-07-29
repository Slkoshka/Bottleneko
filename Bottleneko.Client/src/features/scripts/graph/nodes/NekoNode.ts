import { ClassicPreset } from 'rete';
import { NekoSocket } from '../sockets';

export class NekoNode<Inputs extends Partial<Record<string, NekoSocket>>, Outputs extends Partial<Record<string, NekoSocket>>, Controls extends Partial<Record<string, ClassicPreset.Control>>> extends ClassicPreset.Node<Inputs, Outputs, Controls> {
    disconnect(source: NekoSocket | null, target: NekoSocket) {
        void source;
        void target;

        return false;
    }

    connect(source: NekoSocket, target: NekoSocket) {
        void source;
        void target;

        return false;
    }
}
