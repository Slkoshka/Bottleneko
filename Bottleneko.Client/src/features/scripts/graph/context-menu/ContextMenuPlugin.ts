import { BaseSchemes, GetSchemes, NodeEditor, Scope } from 'rete';
import { Position, RenderSignal } from 'rete-react-plugin';
import { BaseArea, BaseAreaPlugin } from 'rete-area-plugin';
import { NodeCollection, nodes } from '../nodes';
import { Item } from '.';

export type ContextMenuExtra =
    RenderSignal<'contextmenu', {
        items: Item[];
        onHide(): void;
        searchBar?: boolean;
    }>;

type Requires<Schemes extends BaseSchemes> =
    { type: 'contextmenu'; data: { event: MouseEvent; context: 'root' | Schemes['Node'] | Schemes['Connection'] } } |
    { type: 'unmount'; data: { element: HTMLElement } } |
    { type: 'pointerdown'; data: { position: Position; event: PointerEvent } };

export type BSchemes = GetSchemes<
    BaseSchemes['Node'] & { clone?: () => BaseSchemes['Node'] },
    BaseSchemes['Connection']
>;

function getItems<Schemes extends BSchemes>(context: 'root' | Schemes['Node'], plugin: ContextMenuPlugin<Schemes>) {
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
                handler: async () => {
                    const node = items.default();
                    await editor.addNode(node);
                    void area.translate(node.id, area.area.pointer);
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

    const clone = context.clone?.bind(context);
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

export class ContextMenuPlugin<Schemes extends BaseSchemes> extends Scope<never, [Requires<Schemes> | ContextMenuExtra]> {
    constructor() {
        super('context-menu');
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
