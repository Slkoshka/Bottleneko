import { CSSProperties, useRef, useState } from 'react';
import { SocketData } from './ContextMenuPlugin';
import { Item } from '.';

interface ContextMenuItemProps {
    data: Item;
    delay: number;
    hideMenu: () => void;
    setShownSubmenu: (args: { key: string; element: HTMLElement } | null) => void;
    shownSubmenu: string | null;
    submenuPosition: { x: number; y: number };
    children: React.ReactNode;
    autoConnectTo?: SocketData;
    style?: CSSProperties;
}

export function ContextMenuItem({ data, delay, hideMenu, setShownSubmenu, shownSubmenu, submenuPosition, children, autoConnectTo, style }: ContextMenuItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [shownChildSubmenu, setShownChildSubmenu] = useState<string | null>(null);
    const [childSubmenuPosition, setChildSubmenuPosition] = useState({ x: 0, y: 0 });

    const changeShownChildSubmenu = (args: { key: string; element: HTMLElement } | null) => {
        if (args) {
            const bounds = args.element.getBoundingClientRect();
            const parentBounds = (args.element.parentElement ?? args.element).getBoundingClientRect();
            setChildSubmenuPosition({ x: parentBounds.right, y: bounds.top });
        }
        setShownChildSubmenu(args?.key ?? null);
    };

    return (
        <div
            ref={ref}
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
            onPointerOver={(e) => {
                if (data.subitems) {
                    setShownSubmenu({ key: data.key, element: ref.current as HTMLElement });
                }
                else {
                    setShownSubmenu(null);
                }
                e.preventDefault();
                e.stopPropagation();
            }}
            className={`graph-context-menu-item ${data.subitems ? 'graph-context-menu-item-folder' : ''}`}
            style={style}
        >
            {children}
            {
                data.subitems && shownSubmenu === data.key
                    ? (
                            <div className="graph-context-menu-subitems" style={{ left: submenuPosition.x, top: submenuPosition.y }}>
                                {
                                    data.subitems.map(item => (
                                        <ContextMenuItem
                                            key={item.key}
                                            data={item}
                                            delay={delay}
                                            hideMenu={hideMenu}
                                            autoConnectTo={autoConnectTo}
                                            setShownSubmenu={changeShownChildSubmenu}
                                            shownSubmenu={shownChildSubmenu}
                                            submenuPosition={childSubmenuPosition}
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
