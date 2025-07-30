import { useCallback, useState } from 'react';
import { useDebounce } from '../../../../../app/hooks';
import { SocketData } from './ContextMenuPlugin';
import { Item } from '.';

interface ContextMenuItemProps {
    data: Item;
    delay: number;
    hide: () => void;
    children: React.ReactNode;
    autoConnectTo?: SocketData;
}

export function ContextMenuItem(props: ContextMenuItemProps) {
    const [visibleSubitems, setVisibleSubitems] = useState(false);
    const setInvisible = useCallback(() => {
        setVisibleSubitems(false);
    }, [setVisibleSubitems]);
    const [hide, cancelHide] = useDebounce(setInvisible, props.delay);

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                if (props.data.subitems) {
                    e.preventDefault();
                }
                else {
                    void props.data.handler(props.autoConnectTo);
                    props.hide();
                }
            }}
            onPointerDown={(e) => { e.stopPropagation(); }}
            onPointerOver={() => {
                cancelHide();
                setVisibleSubitems(true);
            }}
            onPointerLeave={() => { hide(); }}
            className={`graph-context-menu-item ${props.data.subitems ? 'graph-context-menu-item-folder' : ''}`}
            data-testid="context-menu-item"
        >
            {props.children}
            {props.data.subitems && visibleSubitems && (
                <div className="graph-context-menu-subitems">
                    {props.data.subitems.map(item => (
                        <ContextMenuItem
                            key={item.key}
                            data={item}
                            delay={props.delay}
                            hide={props.hide}
                            autoConnectTo={props.autoConnectTo}
                        >
                            {item.label}
                        </ContextMenuItem>
                    ))}
                </div>
            )}
        </div>
    );
}
