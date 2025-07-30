import { GetSchemes, NodeEditor, NodeId } from 'rete';
import { BaseArea, BaseAreaPlugin } from 'rete-area-plugin';
import { Selectable } from 'rete-area-plugin/_types/extensions/selectable';
import { NekoNode } from '../nodes';
import NekoConnection from '../connections/NekoConnection';

type Schemes = GetSchemes<NekoNode & { selected?: boolean }, NekoConnection>;

export function nodeSelection<T>(base: BaseAreaPlugin<Schemes, T>, core: Selectable) {
    let editor: null | NodeEditor<Schemes> = null;
    const area = base as BaseAreaPlugin<Schemes, BaseArea<Schemes>>;
    const getEditor = () => editor ?? (editor = area.parentScope<NodeEditor<Schemes>>(NodeEditor));
    let holdingModifier = false;

    let state: { type: 'node_drag'; nodeId: NodeId; withModifier: boolean; distance: number } | { type: 'viewport_drag'; distance: number } | null = null;

    function selectNode(node: Schemes['Node']) {
        if (!node.selected) {
            node.selected = true;
            void area.update('node', node.id);
        }
    }

    function unselectNode(node: Schemes['Node']) {
        if (node.selected) {
            node.selected = false;
            void area.update('node', node.id);
        }
    }

    function add(nodeId: NodeId, accumulate: boolean) {
        const node = getEditor().getNode(nodeId);

        if (!node) return;

        core.add({
            label: 'node',
            id: node.id,
            translate(dx, dy) {
                const view = area.nodeViews.get(node.id);
                const current = view?.position;

                if (current) {
                    void view.translate(current.x + dx, current.y + dy);
                }
            },
            unselect() {
                unselectNode(node);
            },
        }, accumulate);
        selectNode(node);
    }

    function remove(nodeId: NodeId) {
        core.remove({ id: nodeId, label: 'node' });
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Control' || e.key === 'Meta' || e.key === 'Shift') {
            holdingModifier = true;
        }
    }

    function onKeyUp(e: KeyboardEvent) {
        if (e.key === 'Control' || e.key === 'Meta' || e.key === 'Shift') {
            holdingModifier = false;
        }
    }

    function destroy() {
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    area.addPipe((context) => {
        if (context.type === 'nodepicked') {
            const pickedId = context.data.id;

            core.pick({ id: pickedId, label: 'node' });
            state = { type: 'node_drag', nodeId: pickedId, withModifier: holdingModifier, distance: 0 };
            add(pickedId, core.isSelected({ id: pickedId, label: 'node' }) || holdingModifier);
        }
        else if (context.type === 'nodetranslated') {
            if (state?.type === 'node_drag') {
                const { id, position, previous } = context.data;
                const dx = position.x - previous.x;
                const dy = position.y - previous.y;

                if (core.isPicked({ id, label: 'node' })) {
                    state.distance += Math.abs(dx + dy);
                    core.translate(dx, dy);
                }
            }
        }
        else if (context.type === 'pointerdown') {
            state = { type: 'viewport_drag', distance: 0 };
        }
        else if (context.type === 'pointermove') {
            if (state?.type === 'viewport_drag') {
                state.distance++;
            }
        }
        else if (context.type === 'pointerup') {
            switch (state?.type) {
                case 'viewport_drag':
                    if (state.distance < 4) {
                        core.unselectAll();
                    }
                    break;

                case 'node_drag':
                    if (state.distance < 4 && !state.withModifier) {
                        core.unselectAll();
                        add(state.nodeId, false);
                    }
                    break;
            }
            state = null;
        }

        return context;
    });

    return {
        select: add,
        unselect: remove,
        destroy: destroy,
    };
}
