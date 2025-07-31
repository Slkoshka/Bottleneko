import { ClassicPreset, NodeEditor } from 'rete';
import { NekoSocket } from '../sockets';
import { Schemes } from '../editor';
import { NekoNode } from '.';

export interface NodeSocket { node: NekoNode; socket: NekoSocket }

export interface NodeProps {
    refresh?: (node: NekoNode) => void;
    editor: NodeEditor<Schemes>;
}

export abstract class NekoNodeBase<Inputs extends Partial<Record<string, NekoSocket>>, Outputs extends Partial<Record<string, NekoSocket>>, Controls extends Partial<Record<string, ClassicPreset.Control>>> extends ClassicPreset.Node<Inputs, Outputs, Controls> {
    width?: number;
    height?: number;

    constructor(name: string, readonly props: NodeProps) {
        super(name);
    }

    connect(editor: NodeEditor<Schemes>, source: NodeSocket, target: NodeSocket) {
        void editor;
        void source;
        void target;

        return false;
    }

    disconnect(editor: NodeEditor<Schemes>, source: NodeSocket | null, target: NodeSocket) {
        void editor;
        void source;
        void target;

        return false;
    }

    getInput(id: string) {
        return (this.inputs as Record<string, ClassicPreset.Input<NekoSocket> | undefined>)[id];
    }

    getOutput(id: string) {
        return (this.outputs as Record<string, ClassicPreset.Output<NekoSocket> | undefined>)[id];
    }
}
