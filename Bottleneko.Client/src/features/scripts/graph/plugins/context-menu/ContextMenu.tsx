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
                            <div className="graph-context-menu-common">
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
            {
                filteredList.map(item => (
                    <ContextMenuItem
                        key={item.key}
                        data={item}
                        delay={props.delay}
                        hide={props.onHide}
                        autoConnectTo={props.autoConnectTo}
                    >
                        {item.label}
                    </ContextMenuItem>
                ))
            }
        </div>
    );
}
