import { FormEventHandler, MouseEventHandler, ReactNode } from 'react';
import { Form } from 'react-bootstrap';

export function ContextMenuRenderer({ children, ...props }: { children?: ReactNode; props?: object }) {
    return (
        <div className="graph-context-menu" {...props}>
            {children}
        </div>
    );
}

export function ContextMenuCommonRenderer({ children, ...props }: { children?: ReactNode; props?: object }) {
    return (
        <div className="graph-context-menu-common" {...props}>
            {children}
        </div>
    );
}

export function ContextMenuSearchRenderer({ value, onInput, props }: { value?: React.HTMLProps<HTMLInputElement>['value']; onInput?: FormEventHandler<HTMLInputElement>; props?: object }) {
    return (
        <Form.Control className="graph-context-menu-search" placeholder="Search" size="sm" value={value as never} onInput={onInput} {...props} />
    );
}

export function ContextMenuItemRenderer({ hasSubitems, onClick, children, ...props }: { hasSubitems?: boolean; onClick?: MouseEventHandler<HTMLDivElement>; children?: ReactNode; props?: object }) {
    return (
        <div
            onClick={(e) => {
                if (hasSubitems) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                onClick?.(e);
            }}
            className={`graph-context-menu-item ${hasSubitems ? 'graph-context-menu-item-folder' : ''}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function ContextMenuSubItemsRenderer({ children, ...props }: { children?: ReactNode; props?: object }) {
    return (
        <div className="graph-context-menu-subitems" {...props}>
            {children}
        </div>
    );
}
