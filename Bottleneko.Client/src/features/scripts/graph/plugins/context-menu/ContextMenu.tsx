import { useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import { useOnce } from '../../../../../app/hooks';
import { ContextMenuItem } from './ContextMenuItem';
import { SocketData } from './ContextMenuPlugin';
import { Item } from '.';

interface ContextMenuProps {
    items: Item[];
    delay: number;
    searchBar?: boolean;
    onHide: () => void;
    autoConnectTo?: SocketData;
}

const flattenItems = (items: Item[]): Item[] => {
    return [...items.filter(item => !item.subitems || item.subitems.length === 0), ...items.map(item => item.subitems ? flattenItems(item.subitems) : []).reduce((prev, current) => [...prev, ...current])];
};

export function ContextMenu(props: ContextMenuProps) {
    const [filter, setFilter] = useState('');
    const filterRegexp = new RegExp(filter, 'i');
    const filteredList = filter === '' ? props.items : flattenItems(props.items).filter(item => item.label.match(filterRegexp));
    const searchRef = useRef<HTMLElement>(null);
    const [shownSubmenu, setShownSubmenu] = useState<string | null>(null);
    const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

    const changeShownSubmenu = (args: { key: string; element: HTMLElement } | null) => {
        if (args) {
            const bounds = args.element.getBoundingClientRect();
            const parentBounds = (args.element.parentElement ?? args.element).getBoundingClientRect();
            setSubmenuPosition({ x: parentBounds.right, y: bounds.top });
        }
        setShownSubmenu(args?.key ?? null);
    };

    const setFocus = () => {
        if (searchRef.current) {
            searchRef.current.focus();
        }
        else {
            setTimeout(setFocus, 50);
        }
    };
    useOnce(() => {
        setFocus();
    });

    return (
        <div
            className="graph-context-menu"
            onWheel={(e) => { e.stopPropagation(); }}
            data-testid="context-menu"
        >
            {
                props.searchBar
                    ? (
                            <div
                                className="graph-context-menu-common"
                                onClick={(e) => { e.stopPropagation(); }}
                                onDoubleClick={(e) => { e.stopPropagation(); }}
                            >
                                <Form.Control
                                    ref={searchRef as never}
                                    className="graph-context-menu-search"
                                    data-testid="context-menu-search-input"
                                    placeholder="Search"
                                    size="sm"
                                    value={filter}
                                    onInput={(e) => { setFilter((e.target as HTMLInputElement).value); }}
                                    onPointerDown={(e) => { e.stopPropagation(); }}
                                />
                            </div>
                        )
                    : <></>
            }
            <div className="graph-context-menu-items">
                {
                    filteredList.sort((a, b) => a.label.localeCompare(b.label)).map(item => (
                        <ContextMenuItem
                            key={item.key}
                            data={item}
                            delay={props.delay}
                            hideMenu={props.onHide}
                            shownSubmenu={shownSubmenu}
                            setShownSubmenu={changeShownSubmenu}
                            submenuPosition={submenuPosition}
                            autoConnectTo={props.autoConnectTo}
                        >
                            {item.label}
                        </ContextMenuItem>
                    ))
                }
            </div>
        </div>
    );
}
