import { BaseSchemes, ClassicPreset, GetSchemes, NodeEditor, Scope } from 'rete';
import { Position, RenderSignal } from 'rete-react-plugin';
import { BaseArea, BaseAreaPlugin } from 'rete-area-plugin';
import { Connection } from 'rete-connection-plugin';
import { AnyNekoNode, NodeCollection, nodes } from '../nodes';
import { NekoSocket } from '../sockets';
import NekoConnection from '../connections/NekoConnection';
import { Item } from '.';

export type ContextMenuExtra =
    RenderSignal<'contextmenu', {
        items: Item[];
        onHide(): void;
        searchBar?: boolean;
    }>;

export interface SocketData {
    nodeId: string;
    key: string;
    side: 'input' | 'output';
}

type Requires<Schemes extends BaseSchemes> =
    { type: 'contextmenu'; data: { event: MouseEvent; context: 'root' | AnyNekoNode | Schemes['Connection']; autoConnectTo?: SocketData } } |
    { type: 'unmount'; data: { element: HTMLElement } } |
    { type: 'pointerdown'; data: { position: Position; event: PointerEvent } } |
    { type: 'pointermove'; data: { position: Position; event: PointerEvent } };

export type BSchemes = GetSchemes<
    AnyNekoNode,
    BaseSchemes['Connection']
>;

function getItems<Schemes extends BSchemes>(context: 'root' | AnyNekoNode | BaseSchemes['Connection'], plugin: ContextMenuPlugin<Schemes>) {
    const area = plugin.parentScope<BaseAreaPlugin<Schemes, unknown>>(BaseAreaPlugin);
    const editor = area.parentScope<NodeEditor<Schemes>>(NodeEditor);

    const extractNodes = (nodes: NodeCollection): Item[] => nodes.map(([name, items], idx) => {
        if (Array.isArray(items)) {
            return {
                label: name,
                key: idx.toString(),
                handler: () => { /* do nothing */ },
                subitems: extractNodes(items).map(item => ({
                    ...item,
                    key: `${idx.toString()}-${item.key}`,
                })),
            };
        }
        else {
            return {
                label: name,
                key: idx.toString(),
                handler: async (autoConnectTo) => {
                    const node = items.default();
                    await editor.addNode(node);
                    void area.translate(node.id, area.area.pointer);

                    type NamedPort = [name: string, port: ClassicPreset.Port<NekoSocket>];
                    const findMatch = (node: AnyNekoNode, nodeSide: 'input' | 'output', connectTo: NamedPort) => {
                        const pins = nodeSide === 'input' ? node.inputs : node.outputs;
                        const sockets = Object.entries(pins) as NamedPort[];

                        const isCompatible = (mySocket: NekoSocket) => nodeSide === 'input' ? connectTo[1].socket.isCompatibleWith(mySocket) : mySocket.isCompatibleWith(connectTo[1].socket);
                        const strategies = [
                            ([key, pin]: NamedPort) => {
                                return key === connectTo[0] && isCompatible(pin.socket);
                            },
                            ([, pin]: NamedPort) => isCompatible(pin.socket),
                        ];

                        for (const strategy of strategies) {
                            const match = sockets.find(strategy);
                            if (match) {
                                return match[0];
                            }
                        }
                        return undefined;
                    };

                    const autoConnectNode = autoConnectTo ? editor.getNode(autoConnectTo.nodeId) : undefined;
                    if (autoConnectTo && autoConnectNode) {
                        const socket = ((autoConnectTo.side === 'input' ? autoConnectNode.inputs : autoConnectNode.outputs) as Record<string, ClassicPreset.Port<NekoSocket> | undefined>)[autoConnectTo.key];
                        if (socket) {
                            const matchingSocket = findMatch(node, autoConnectTo.side === 'input' ? 'output' : 'input', [autoConnectTo.key, socket]);
                            if (matchingSocket) {
                                if (autoConnectTo.side === 'input') {
                                    await editor.addConnection(new NekoConnection(node, matchingSocket as never, autoConnectNode, autoConnectTo.key as never));
                                }
                                else {
                                    await editor.addConnection(new NekoConnection(autoConnectNode, autoConnectTo.key as never, node, matchingSocket as never));
                                }
                            }
                        }
                    }
                },
            };
        }
    });

    if (context === 'root') {
        return {
            searchBar: true,
            list: extractNodes(nodes),
        };
    }

    const deleteItem: Item = {
        label: 'Delete',
        key: 'delete',
        async handler() {
            if ('source' in context && 'target' in context) {
                // Connection
                await editor.removeConnection(context.id);
            }
            else {
                // Node
                const connections = editor.getConnections().filter(c => c.source === context.id || c.target === context.id);
                for (const connection of connections) {
                    await editor.removeConnection(connection.id);
                }
                await editor.removeNode(context.id);
            }
        },
    };

    const clone = context instanceof ClassicPreset.Connection ? undefined : (context as AnyNekoNode).clone.bind(context);
    const cloneItem: undefined | Item = clone
        ? {
                label: 'Clone',
                key: 'clone',
                async handler() {
                    const node = clone();
                    await editor.addNode(node);
                    void area.translate(node.id, area.area.pointer);
                },
            }
        : undefined;

    return {
        searchBar: false,
        list: [
            deleteItem,
            ...(cloneItem ? [cloneItem] : []),
        ],
    };
}

export class ContextMenuPlugin<Schemes extends BSchemes> extends Scope<never, [Requires<Schemes> | ContextMenuExtra]> {
    lastPointerEvent?: PointerEvent;

    constructor() {
        super('context-menu');
    }

    useConnections(connections: Scope<Connection | Requires<Schemes>>) {
        connections.addPipe((context) => {
            if (context.type === 'pointermove') {
                this.lastPointerEvent = context.data.event;
            }
            else if (this.lastPointerEvent && context.type === 'connectiondrop' && context.data.socket === null && !context.data.created) {
                void this.parentScope().emit({
                    type: 'contextmenu',
                    data: {
                        event: this.lastPointerEvent,
                        context: 'root',
                        autoConnectTo: {
                            nodeId: context.data.initial.nodeId,
                            key: context.data.initial.key,
                            side: context.data.initial.side,
                        },
                    },
                });
            }
            return context;
        });
    }

    setParent(scope: Scope<Requires<Schemes>>): void {
        super.setParent(scope);

        const area = this.parentScope<BaseAreaPlugin<Schemes, BaseArea<Schemes>>>(BaseAreaPlugin);
        const container = (area as unknown as { container?: unknown }).container;

        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('Container expected');
        }

        const element = document.createElement('div');
        element.style.display = 'none';
        element.style.position = 'fixed';

        this.addPipe((context) => {
            const parent = this.parentScope();

            if (context.type === 'unmount') {
                if (context.data.element === element) {
                    element.style.display = 'none';
                }
            }
            else if (context.type === 'contextmenu') {
                context.data.event.preventDefault();
                context.data.event.stopPropagation();

                const { searchBar, list } = getItems(context.data.context, this);

                container.appendChild(element);
                element.style.left = `${context.data.event.clientX.toString()}px`;
                element.style.top = `${context.data.event.clientY.toString()}px`;
                element.style.display = '';

                void parent.emit({
                    type: 'render',
                    data: {
                        type: 'contextmenu',
                        element,
                        searchBar,
                        onHide() {
                            void parent.emit({ type: 'unmount', data: { element } });
                        },
                        items: list,
                        autoConnectTo: context.data.autoConnectTo,
                    },
                });
            }
            else if (context.type === 'pointerdown') {
                if (!context.data.event.composedPath().includes(element)) {
                    void parent.emit({ type: 'unmount', data: { element } });
                }
            }
            return context;
        });
    }
}
