import { ReactNode } from 'react';
import { Button } from 'react-bootstrap';
import { Variant } from 'react-bootstrap/esm/types';

interface FullscreenPageButtonProps {
    children?: ReactNode | ReactNode[];
    variant?: Variant;
    disabled?: boolean;
    size?: 'sm' | 'lg';
    action?: 'submit' | 'reset' | (() => void);
}

export default function FullscreenPageButton({ children, variant, disabled, size, action }: FullscreenPageButtonProps) {
    return (
        <Button
            size={size ?? 'lg'}
            className="mx-2 px-4"
            variant={variant}
            disabled={disabled}
            type={
                typeof action === 'string' ? action : undefined
            }
            onClick={typeof action === 'function' ? action : undefined}
        >
            {children}
        </Button>
    );
}
