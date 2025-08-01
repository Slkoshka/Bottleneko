import { ClassicPreset, NodeEditor } from 'rete';
import { BaseAreaPlugin } from 'rete-area-plugin';
import { NekoSocket } from '../sockets';
import { Schemes } from '../editor';
import { NekoNode } from '.';

export interface NodeSocket { node: NekoNode; socket: NekoSocket }

export type NodeState = object;

export interface NodeSerializationData {
    type: string;
    state: unknown;
}

export interface NodeProps {
    editor?: NodeEditor<Schemes>;
    area?: BaseAreaPlugin<Schemes, unknown>;
}

export abstract class NekoNodeBase<Inputs extends Partial<Record<string, NekoSocket>>, Outputs extends Partial<Record<string, NekoSocket>>, Controls extends Partial<Record<string, ClassicPreset.Control>>, State extends NodeState = NodeState, Props extends NodeProps = NodeProps> extends ClassicPreset.Node<Inputs, Outputs, Controls> {
    abstract type: string;
    abstract category: null | 'control' | 'events' | 'math' | 'text-ops' | 'utils';
    state: State;
    initial: State;

    width?: number;
    height?: number;
    readonly isEvent: boolean = false;

    constructor(name: string, initial: State, readonly props: Props) {
        super(name);
        this.state = this.initial = initial;
        this.props = props;
    }

    connect(source: NodeSocket, target: NodeSocket): Promise<boolean> {
        void source;
        void target;

        return new Promise((resolve) => {
            resolve(false);
        });
    }

    disconnect(source: NodeSocket | null, target: NodeSocket) {
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

    serialize(): NodeSerializationData {
        return { type: this.type, state: this.state };
    }

    async stateUpdated() {
        await this.dirty();
    }

    async deserialize(data: State) {
        this.state = data;
        await this.stateUpdated();
    }

    async refreshEditorView() {
        await this.props.area?.emit({ type: 'noderefresh', node: this });
    }

    async dirty() {
        await this.props.area?.emit({ type: 'nodechanged', node: this });
    }
}
