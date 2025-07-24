import { ReactNode } from 'react';
import { Button, ButtonProps } from 'react-bootstrap';

export default function ModalDialogButton({ disabled, children, onClick, ...props }: { disabled?: boolean; children?: ReactNode; onClick?: () => void } & ButtonProps) {
    return (
        <Button disabled={disabled} onClick={onClick} {...props}>{children}</Button>
    );
}
