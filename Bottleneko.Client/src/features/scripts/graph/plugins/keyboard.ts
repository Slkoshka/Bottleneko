import * as clipboard from 'clipboard-polyfill';
import { GetSchemes, NodeEditor } from 'rete';
import { HistoryPlugin } from 'rete-history-plugin';
import { Action } from 'rete-history-plugin/_types/types';
import { NekoNode } from '../nodes';
import NekoConnection from '../connections/NekoConnection';
import { deserializeEditor, serializeEditor } from '../serialization';
import { GraphScriptCode } from '../../../api/dtos.gen';
import { NekoAreaPlugin } from '../editor';

type NekoSchemes = GetSchemes<NekoNode, NekoConnection>;

export function setupShortcuts<Schemes extends NekoSchemes, A extends Action>(element: HTMLElement, editor: NodeEditor<Schemes>, area: NekoAreaPlugin, plugin: HistoryPlugin<Schemes, A>) {
    const deleteSelection = async () => {
        for (const node of editor.getNodes().filter(node => node.selected)) {
            const connections = editor.getConnections().filter(c => c.source === node.id || c.target === node.id);
            for (const connection of connections) {
                await editor.removeConnection(connection.id);
            }
            await editor.removeNode(node.id);
        }
    };

    const selectAll = async () => {
        for (const node of editor.getNodes()) {
            node.selected = true;
            await area.update('node', node.id);
        }
        await area.emit({ type: 'refreshselection' });
    };

    const copySelection = async () => {
        const selectedNodes = editor.getNodes().filter(node => node.selected);
        const selectedNodeIds = new Set(selectedNodes.map(node => node.id));
        const selectedConnections = editor.getConnections().filter(c => selectedNodeIds.has(c.source) && selectedNodeIds.has(c.target));
        const data = JSON.stringify(serializeEditor({
            getNodes: () => selectedNodes,
            getConnections: () => selectedConnections,
        }, area));
        await clipboard.writeText(data);
    };

    const cutSelection = async () => {
        await copySelection();
        await deleteSelection();
    };

    const paste = async () => {
        const data = JSON.parse(await clipboard.readText()) as GraphScriptCode;
        const nodes = await deserializeEditor(editor, area, data, { additive: true, randomizeIds: true });
        for (const node of nodes) {
            node.selected = true;
            await area.update('node', node.id);
        }
        await area.emit({ type: 'refreshselection' });
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
            e => e.code === 'KeyX' && (e.ctrlKey || e.metaKey) && !e.shiftKey,
            cutSelection,
        ],
        [
            e => e.code === 'KeyA' && (e.ctrlKey || e.metaKey) && !e.shiftKey,
            selectAll,
        ],
        [
            e => e.code === 'KeyC' && (e.ctrlKey || e.metaKey) && !e.shiftKey,
            copySelection,
        ],
        [
            e => e.code === 'KeyV' && (e.ctrlKey || e.metaKey) && !e.shiftKey,
            paste,
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
