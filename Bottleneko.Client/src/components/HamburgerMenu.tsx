import { CSSProperties, forwardRef, MouseEventHandler, Ref } from 'react';
import IconButton from './IconButton';

export const HamburgerMenu = forwardRef(function HamburgerMenu({ onClick, style }: { onClick: MouseEventHandler<HTMLButtonElement>; style: CSSProperties }, ref: Ref<HTMLButtonElement>) {
    return (
        <IconButton
            icon="list"
            tooltip={null}
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
            ref={ref}
            style={style}
        />
    );
});
