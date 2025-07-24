import { ReactNode } from 'react';
import { ButtonVariant } from 'react-bootstrap/esm/types';
import ModalDialog from './modal-dialog/ModalDialog';

export interface ConfirmationDialogProps { children?: ReactNode; title?: string; show: boolean; onCancel?: () => void; onAccept?: () => void; cancelText?: string; acceptText?: string; acceptVariant?: ButtonVariant }

export default function ConfirmationDialog({ children, title, show, onCancel, onAccept, cancelText, acceptText, acceptVariant }: ConfirmationDialogProps) {
    return (
        <ModalDialog
            title={title ?? 'Confirmation'}
            show={show}
            onCancel={onCancel}
        >
            {children}

            <ModalDialog.Button onClick={onCancel} variant="secondary">{cancelText ?? 'Cancel'}</ModalDialog.Button>
            <ModalDialog.Button onClick={onAccept} variant={acceptVariant ?? 'primary'}>{acceptText ?? 'Accept'}</ModalDialog.Button>
        </ModalDialog>
    );
}
