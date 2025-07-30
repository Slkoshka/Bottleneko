import { RenderPreset } from 'rete-react-plugin/_types/presets/types';
import { RenderSignal } from 'rete-react-plugin';
import { Schemes } from '../../editor';
import { ContextMenu } from './ContextMenu';
import { SocketData } from './ContextMenuPlugin';

export interface Item {
    label: string;
    key: string;
    handler(autoConnectTo?: SocketData): void | Promise<void>;
    subitems?: Item[];
}

export type ContextMenuRender = RenderSignal<'contextmenu', {
    items: Item[];
    onHide(): void;
    searchBar?: boolean;
    autoConnectTo?: SocketData;
}>;

export function setupContextMenu<K extends ContextMenuRender>(): RenderPreset<Schemes, K> {
    return {
        render(context) {
            if (context.data.type as string === 'contextmenu') {
                return (
                    <ContextMenu
                        items={context.data.items}
                        delay={200}
                        searchBar={context.data.searchBar}
                        onHide={() => { context.data.onHide(); }}
                        autoConnectTo={context.data.autoConnectTo}
                    />
                );
            }
        },
    };
}
