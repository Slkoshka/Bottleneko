import { BaseSchemes } from 'rete';
import { ContextMenuRender } from 'rete-react-plugin/_types/presets/context-menu/types';
import { RenderPreset } from 'rete-react-plugin/_types/presets/types';
import { ContextMenu } from './ContextMenu';

export interface Item {
    label: string;
    key: string;
    handler(): void | Promise<void>;
    subitems?: Item[];
}

export function setupContextMenu<Schemes extends BaseSchemes, K extends ContextMenuRender>(): RenderPreset<Schemes, K> {
    return {
        render(context) {
            if (context.data.type as string === 'contextmenu') {
                return (
                    <ContextMenu
                        items={context.data.items}
                        delay={200}
                        searchBar={context.data.searchBar}
                        onHide={() => { context.data.onHide(); }}
                    />
                );
            }
        },
    };
}
