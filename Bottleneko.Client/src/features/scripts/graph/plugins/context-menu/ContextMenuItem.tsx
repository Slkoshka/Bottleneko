import { useCallback, useState } from 'react';
import { useDebounce } from '../../../../../app/hooks';
import { SocketData } from './ContextMenuPlugin';
import { Item } from '.';

interface ContextMenuItemProps {
    data: Item;
    delay: number;
    hideMenu: () => void;
    setShownSubmenu: (key: string | null) => void;
    shownSubmenu: string | null;
    children: React.ReactNode;
    autoConnectTo?: SocketData;
}

export function ContextMenuItem({ data, delay, hideMenu, setShownSubmenu, shownSubmenu, children, autoConnectTo }: ContextMenuItemProps) {
    const setInvisible = useCallback(() => {
        if (shownSubmenu === data.key) {
            setShownSubmenu(null);
        }
    }, [shownSubmenu, setShownSubmenu, data.key]);
    const [hide, cancelHide] = useDebounce(setInvisible, delay);
    const [shownChildSubmenu, setShownChildSubmenu] = useState<string | null>(null);

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                if (data.subitems) {
                    e.preventDefault();
                }
                else {
                    void data.handler(autoConnectTo);
                    hideMenu();
                }
            }}
            onPointerDown={(e) => { e.stopPropagation(); }}
            onPointerOver={() => {
                cancelHide();
                if (data.subitems) {
                    setShownSubmenu(data.key);
                }
            }}
            onPointerLeave={() => {
                hide();
            }}
            className={`graph-context-menu-item ${data.subitems ? 'graph-context-menu-item-folder' : ''}`}
            data-testid="context-menu-item"
        >
            {children}
            {
                data.subitems?.sort((a, b) => a.label.localeCompare(b.label)) && shownSubmenu === data.key
                    ? (
                            <div className="graph-context-menu-subitems">
                                {
                                    data.subitems.map(item => (
                                        <ContextMenuItem
                                            key={item.key}
                                            data={item}
                                            delay={delay}
                                            hideMenu={hideMenu}
                                            autoConnectTo={autoConnectTo}
                                            setShownSubmenu={setShownChildSubmenu}
                                            shownSubmenu={shownChildSubmenu}
                                        >
                                            {item.label}
                                        </ContextMenuItem>
                                    ))
                                }
                            </div>
                        )
                    : <></>
            }
        </div>
    );
}
