import './styles/graph.scss';
import { createRoot } from 'react-dom/client';
import { NodeEditor, GetSchemes, Root } from 'rete';
import { ReactPlugin, Presets, ReactArea2D } from 'rete-react-plugin';
import { Area2D, AreaExtensions, AreaPlugin } from 'rete-area-plugin';
import { ConnectionPlugin, getSourceTarget } from 'rete-connection-plugin';
import { HistoryPlugin, Presets as HistoryPresets } from 'rete-history-plugin';
import { ScriptCode } from '../../api/dtos.gen';
import { NekoNode } from './nodes';
import NekoConnection from './connections/NekoConnection';
import { NodeRenderer } from './renderers/NodeRenderer';
import { SocketRenderer } from './renderers/SocketRenderer';
import { NekoSocket } from './sockets';
import { ConnectionRenderer } from './renderers/ConnectionRenderer';
import { NekoNodeBase } from './nodes/NekoNodeBase';
import { ControlRenderer } from './renderers/ControlRenderer';
import { setupContextMenu } from './plugins/context-menu';
import { ContextMenuExtra, ContextMenuPlugin } from './plugins/context-menu/ContextMenuPlugin';
import { nodeSelection } from './plugins/nodeSelection';
import { setupShortcuts } from './plugins/keyboard';
import { ConnectionFlow } from './plugins/connections';

export type Schemes = GetSchemes<
    NekoNode,
    NekoConnection
>;

type AreaExtra = Root<Schemes> | Area2D<Schemes> | ReactArea2D<Schemes> | ContextMenuExtra;

export interface Editor {
    destroy: () => void;
    showContextMenu: (x: number, y: number) => void;
}

export function createEditor(container: HTMLElement, onChange: (code: ScriptCode) => void): Editor {
    const editor = new NodeEditor<Schemes>();

    const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
    const area = new AreaPlugin<Schemes, AreaExtra>(container);
    const connection = new ConnectionPlugin<Schemes, AreaExtra>();
    const history = new HistoryPlugin<Schemes>();

    history.addPreset(HistoryPresets.classic.setup());

    const contextMenu = new ContextMenuPlugin();

    const selector = AreaExtensions.selector();

    const selection = nodeSelection(area, selector);
    AreaExtensions.simpleNodesOrder(area);
    AreaExtensions.restrictor(area, {
        scaling: () => ({ min: 0.175, max: 4 }),
    });

    render.addPreset(Presets.classic.setup<Schemes, ReactArea2D<Schemes>>({
        customize: {
            connection() {
                return ConnectionRenderer;
            },
            node() {
                return NodeRenderer;
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

    connection.addPreset(() => new ConnectionFlow({
        connectionPicked() {
            void area.emit({ type: 'hidecontextmenu' });
        },
        canMakeConnection(from, to) {
            const [source, target] = getSourceTarget(from, to) ?? [null, null];
            if (!source || !target || from === to) {
                return false;
            }

            const sourcePort = editor.getNode(source.nodeId)?.getOutput(source.key);
            const targetPort = editor.getNode(target.nodeId)?.getInput(target.key);

            if (!sourcePort || !targetPort) {
                return false;
            }

            if (!sourcePort.socket.isCompatibleWith(targetPort.socket)) {
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

            if (sourceNode === targetNode) {
                connection.isLoop = true;
            }

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

    const shortcuts = setupShortcuts(container, editor, history);
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
            if (sourceNode && targetNode && targetNode instanceof NekoNodeBase) {
                const source = sourceNode.getOutput(context.data.sourceOutput);
                const target = targetNode.getInput(context.data.targetInput);
                if (source && target) {
                    if (targetNode.connect(editor, { node: sourceNode, socket: source.socket }, { node: targetNode, socket: target.socket })) {
                        void area.update('node', context.data.target);
                    }
                }
            }
        }
        else if (context.type === 'connectionremoved') {
            const sourceNode = editor.getNode(context.data.source);
            const targetNode = editor.getNode(context.data.target);
            if (sourceNode && targetNode) {
                const source = sourceNode.getOutput(context.data.sourceOutput);
                const target = targetNode.getInput(context.data.targetInput);
                if (target) {
                    if (targetNode.disconnect(editor, !source ? null : { node: sourceNode, socket: source.socket }, { node: targetNode, socket: target.socket })) {
                        void area.update('node', context.data.target);
                    }
                }
            }
        }

        return context;
    });

    setTimeout(() => {
        if (editor.getNodes().length > 0) {
            void AreaExtensions.zoomAt(area, editor.getNodes());
        }
        else {
            void area.area.zoom(0.8);
        }
    }, 10);

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
            selection.destroy();
            shortcuts.destroy();
        },
    };
};
