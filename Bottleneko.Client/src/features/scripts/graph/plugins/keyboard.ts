import { GetSchemes, NodeEditor } from 'rete';
import { HistoryPlugin } from 'rete-history-plugin';
import { Action } from 'rete-history-plugin/_types/types';
import { NekoNode } from '../nodes';
import NekoConnection from '../connections/NekoConnection';

type NekoSchemes = GetSchemes<NekoNode, NekoConnection>;

export function setupShortcuts<Schemes extends NekoSchemes, A extends Action>(element: HTMLElement, editor: NodeEditor<Schemes>, plugin: HistoryPlugin<Schemes, A>) {
    const deleteSelection = async () => {
        for (const node of editor.getNodes().filter(node => node.selected)) {
            const connections = editor.getConnections().filter(c => c.source === node.id || c.target === node.id);
            for (const connection of connections) {
                await editor.removeConnection(connection.id);
            }
            await editor.removeNode(node.id);
        }
    };

    const shortcuts: [predicate: (e: KeyboardEvent) => boolean, action: (e: KeyboardEvent) => Promise<void> | void][] = [
        [
            e => e.code === 'KeyZ' && (e.ctrlKey || e.metaKey),
            (e) => {
                if (e.shiftKey) {
                    void plugin.redo();
                }
                else {
                    void plugin.undo();
                }
            },
        ],
        [
            e => e.code === 'KeyY' && (e.ctrlKey || e.metaKey) && !e.shiftKey,
            () => {
                void plugin.redo();
            },
        ],
        [
            e => e.code === 'KeyX' && !e.ctrlKey && !e.metaKey && !e.shiftKey,
            deleteSelection,
        ],
        [
            e => e.code === 'Delete' && !e.ctrlKey && !e.metaKey && !e.shiftKey,
            deleteSelection,
        ],
    ];

    const onKeyDown = (e: KeyboardEvent) => {
        for (const [predicate, action] of shortcuts) {
            if (predicate(e)) {
                e.preventDefault();
                e.stopPropagation();
                void action(e);
            }
        }
    };

    element.addEventListener('keydown', onKeyDown);

    return {
        destroy: () => {
            element.removeEventListener('keydown', onKeyDown);
        },
    };
}
