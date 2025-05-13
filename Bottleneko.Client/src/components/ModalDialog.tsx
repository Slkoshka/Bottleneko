import { Button, Modal } from 'react-bootstrap';

export interface ModalButton { key: string; text: React.ReactNode; onClick?: () => void; props?: object; disabled?: boolean }

const ModalDialog = ({ header, show, buttons, children, onCancel, props }: { header?: React.ReactNode; show: boolean; buttons: ModalButton[]; onCancel?: () => void; props?: object } & React.PropsWithChildren) => {
    return (
        <Modal show={show} onHide={onCancel} className="text-dark" centered size="lg" {...props}>
            <Modal.Header>
                <Modal.Title>{header}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {children}
            </Modal.Body>

            <Modal.Footer>
                {
                    buttons.map(button => <Button key={button.key} onClick={button.onClick} {...button.props} disabled={button.disabled}>{button.text}</Button>)
                }
            </Modal.Footer>
        </Modal>
    );
};

export default ModalDialog;
