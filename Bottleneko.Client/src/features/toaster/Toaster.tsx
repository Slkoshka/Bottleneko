import { Toast, ToastContainer } from 'react-bootstrap';
import { useToaster, useToasterDispatch } from './context';

export default function Toaster() {
    const toaster = useToaster();
    const toasterDispatch = useToasterDispatch();

    return (
        <ToastContainer className="mx-5 my-3" position="top-end">
            {toaster?.toasts.map(t => (
                <Toast key={t.id} onClose={() => { toasterDispatch?.({ action: 'hide', id: t.id }); }} bg={t.variant} delay={5000} autohide>
                    <Toast.Header>
                        <strong className="me-auto">{t.title}</strong>
                    </Toast.Header>
                    <Toast.Body>
                        {t.text}
                    </Toast.Body>
                </Toast>
            ))}
        </ToastContainer>
    );
}
