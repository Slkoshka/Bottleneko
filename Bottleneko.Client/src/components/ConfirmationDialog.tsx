import { ReactNode } from 'react';
import { ButtonVariant } from 'react-bootstrap/esm/types';
import ModalDialog from './ModalDialog';

export interface ConfirmationDialogProps { children?: ReactNode[] | ReactNode; title?: string; show: boolean; onCancel?: () => void; onAccept?: () => void; cancelText?: string; acceptText?: string; acceptVariant?: ButtonVariant }

export default function ConfirmationDialog({ children, title, show, onCancel, onAccept, cancelText, acceptText, acceptVariant }: ConfirmationDialogProps) {
    return (
        <ModalDialog
            header={title ?? 'Confirmation'}
            show={show}
            onCancel={onCancel}
            buttons={[
                { key: 'cancel', text: cancelText ?? 'Cancel', onClick: onCancel, props: { variant: 'secondary' } },
                { key: 'accept', text: acceptText ?? 'Accept', onClick: onAccept, props: { variant: acceptVariant ?? 'primary' } },
            ]}
        >
            {children}
        </ModalDialog>
    );
}
