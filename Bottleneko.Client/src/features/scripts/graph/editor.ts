import './graph.scss';
import { createRoot } from 'react-dom/client';
import { NodeEditor, GetSchemes, ClassicPreset } from 'rete';
import { ReactPlugin, Presets, ReactArea2D } from 'rete-react-plugin';
import { Area2D, AreaExtensions, AreaPlugin } from 'rete-area-plugin';
import { ClassicFlow, ConnectionPlugin, getSourceTarget } from 'rete-connection-plugin';
import { HistoryExtensions, HistoryPlugin, Presets as HistoryPresets } from 'rete-history-plugin';
import { ScriptCode } from '../../api/dtos.gen';
import { AnyNekoNode } from './nodes';
import NekoConnection from './connections/NekoConnection';
import { NodeRenderer } from './renderers/NodeRenderer';
import { SocketRenderer } from './renderers/SocketRenderer';
import { NekoSocket } from './sockets';
import { ConnectionRenderer } from './renderers/ConnectionRenderer';
import { NekoNode } from './nodes/NekoNode';
import { ControlRenderer } from './renderers/ControlRenderer';
import { setupContextMenu } from './context-menu';
import { ContextMenuExtra, ContextMenuPlugin } from './context-menu/ContextMenuPlugin';

type Schemes = GetSchemes<
    AnyNekoNode,
    NekoConnection<AnyNekoNode, AnyNekoNode>
>;

type AreaExtra = Area2D<Schemes> | ReactArea2D<Schemes> | ContextMenuExtra;

export function getConnectionSockets(
    editor: NodeEditor<Schemes>,
    connection: Schemes['Connection'],
) {
    const source = editor.getNode(connection.source);
    const target = editor.getNode(connection.target);

    const output = source && (source.outputs as Record<string, ClassicPreset.Input<NekoSocket>>)[connection.sourceOutput];
    const input = target && (target.inputs as Record<string, ClassicPreset.Output<NekoSocket>>)[connection.targetInput];

    return {
        source: output?.socket,
        target: input?.socket,
    };
}

export interface Editor {
    destroy: () => void;
    showContextMenu: (x: number, y: number) => void;
}

export async function createEditor(container: HTMLElement, onChange: (code: ScriptCode) => void): Promise<Editor> {
    const editor = new NodeEditor<Schemes>();

    const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
    const area = new AreaPlugin<Schemes, AreaExtra>(container);
    const connection = new ConnectionPlugin<Schemes, AreaExtra>();
    const history = new HistoryPlugin<Schemes>();

    HistoryExtensions.keyboard(history);
    history.addPreset(HistoryPresets.classic.setup());

    const contextMenu = new ContextMenuPlugin<Schemes>();

    const selector = AreaExtensions.selector();
    const selectorAccumulating = AreaExtensions.accumulateOnCtrl();

    AreaExtensions.selectableNodes(area, selector, {
        accumulating: selectorAccumulating,
    });
    AreaExtensions.simpleNodesOrder(area);

    render.addPreset(Presets.classic.setup<Schemes, ReactArea2D<Schemes>>({
        customize: {
            connection() {
                return ConnectionRenderer<Schemes>;
            },
            node() {
                return NodeRenderer<Schemes>;
            },
            socket(data) {
                if (data.payload instanceof NekoSocket) {
                    return SocketRenderer;
                }
                return Presets.classic.Socket;
            },
            control() {
                return ControlRenderer;
            },
        },
    }));

    render.addPreset(setupContextMenu());

    connection.addPreset(() => new ClassicFlow({
        canMakeConnection(from, to) {
            const [source, target] = getSourceTarget(from, to) ?? [null, null];
            if (!source || !target || from === to) {
                return false;
            }

            const sourceNode = editor.getNode(source.nodeId);
            const targetNode = editor.getNode(target.nodeId);
            if (!sourceNode || !targetNode) {
                return false;
            }

            const sockets = getConnectionSockets(
                editor,
                new NekoConnection(
                    sourceNode,
                    source.key as never,
                    targetNode,
                    target.key as never,
                ),
            );

            if (!sockets.source || !sockets.target) {
                return false;
            }

            if (!sockets.source.isCompatibleWith(sockets.target)) {
                connection.drop();
                return false;
            }

            return true;
        },
        makeConnection(from, to, context) {
            const [source, target] = getSourceTarget(from, to) ?? [null, null];
            if (!source || !target) {
                return false;
            }

            const { editor } = context;

            const sourceNode = editor.getNode(source.nodeId);
            const targetNode = editor.getNode(target.nodeId);
            if (!sourceNode || !targetNode) {
                return false;
            }

            const connection = new NekoConnection(
                sourceNode,
                source.key as never,
                targetNode,
                target.key as never,
            );

            connection.isLoop = true;

            void editor.addConnection(connection);
            return true;
        },
    }));

    const background = document.createElement('div');
    background.classList.add('graph-background');
    area.area.content.add(background);

    editor.use(area);
    area.use(connection);
    area.use(contextMenu);
    area.use(render);
    area.use(history);
    render.use(reroute);

    contextMenu.useConnections(connection as never);

    let isDirty = false;

    area.addPipe((context) => {
        switch (context.type) {
            case 'nodecreated':
            case 'noderemoved':
            case 'connectioncreated':
            case 'connectionremoved':
            case 'nodetranslated':
            case 'cleared':
                isDirty = true;
                break;
        }

        if (context.type === 'connectioncreated') {
            const sourceNode = editor.getNode(context.data.source);
            const targetNode = editor.getNode(context.data.target);
            if (sourceNode && targetNode && targetNode instanceof NekoNode) {
                const { source, target } = getConnectionSockets(editor, new NekoConnection(sourceNode, context.data.sourceOutput, targetNode, context.data.targetInput));
                if (source && target) {
                    if (targetNode.connect(source, target)) {
                        void area.update('node', context.data.target);
                    }
                }
            }
        }
        else if (context.type === 'connectionremoved') {
            const sourceNode = editor.getNode(context.data.source);
            const targetNode = editor.getNode(context.data.target);
            if (sourceNode && targetNode) {
                const { source, target } = getConnectionSockets(editor, new NekoConnection(sourceNode, context.data.sourceOutput, targetNode, context.data.targetInput));
                if (target) {
                    if (targetNode.disconnect(source ?? null, target)) {
                        void area.update('node', context.data.target);
                    }
                }
            }
        }

        return context;
    });

    await new Promise<null>((f) => {
        f(null);
    });

    setTimeout(() => void AreaExtensions.zoomAt(area, editor.getNodes()), 10);

    const delayedUpdateTimer = setInterval(() => {
        if (isDirty) {
            onChange({ $type: 'Graph', data: '' });
            isDirty = false;
        }
    }, 1000);

    return {
        showContextMenu: (x: number, y: number) => {
            void area.emit({
                type: 'contextmenu',
                data: {
                    event: new PointerEvent('contextmenu', {
                        clientX: x,
                        clientY: y,
                    }),
                    context: 'root',
                },
            });
        },
        destroy: () => {
            if (isDirty) {
                onChange({ $type: 'Graph', data: '' });
                isDirty = false;
            }
            clearInterval(delayedUpdateTimer);
            area.destroy();
        },
    };
};
