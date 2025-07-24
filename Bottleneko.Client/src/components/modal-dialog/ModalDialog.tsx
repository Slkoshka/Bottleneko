import { ReactNode } from 'react';
import { Modal } from 'react-bootstrap';
import { splitChildren } from '../../app/utils';
import ModalDialogTitle from './ModalDialogTitle';
import ModalDialogButton from './ModalDialogButton';

export interface ModalButton { key: string; text: React.ReactNode; onClick?: () => void; props?: object; disabled?: boolean }

export default function ModalDialog({ title, show, children, onCancel, props }: { title?: string; show: boolean; onCancel?: () => void; children: ReactNode; props?: object }) {
    const [titleChildren, buttons, rest] = splitChildren(children, [ModalDialogTitle, ModalDialogButton]);

    return (
        <Modal show={show} onHide={onCancel} className="text-dark" centered size="lg" {...props}>
            <Modal.Header>
                <Modal.Title>
                    {title}
                    {titleChildren}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>{rest}</Modal.Body>
            <Modal.Footer>{buttons}</Modal.Footer>
        </Modal>
    );
};

ModalDialog.Title = ModalDialogTitle;
ModalDialog.Button = ModalDialogButton;
